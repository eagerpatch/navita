use common::convert_import_map_to_id::convert_import_map_to_ids;
use common::get_callee_ident::get_callee_ident;
use serde::Deserialize;
use swc_core::common::collections::AHashSet;
use swc_core::ecma::ast::{ComputedPropName, Ident, MemberExpr, MemberProp, Module, Number};
use swc_core::ecma::utils::private_ident;
use swc_core::{
  common::DUMMY_SP,
  ecma::{
    ast::{Expr, Id, Lit, Program},
    visit::{VisitMut, VisitMutWith},
  },
  plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};

pub struct CallCollector {
  pub config: Config,
  pub ids: AHashSet<Id>,
  pub count: usize,
  pub ident: Ident,
}

impl CallCollector {
  pub fn new(config: Config) -> Self {
    let ident = private_ident!("$$evaluatedValues");

    Self {
      config,
      ids: AHashSet::default(),
      count: 0,
      ident,
    }
  }

  fn style_id(&mut self) -> usize {
    let count = self.count;
    self.count += 1;
    count
  }
}

impl VisitMut for CallCollector {
  fn visit_mut_expr(&mut self, expr: &mut Expr) {
    let callee_ident = get_callee_ident(expr);

    if callee_ident.is_none() {
      return;
    }

    if !self.ids.contains(&callee_ident.unwrap().to_id()) {
      // Continue visiting expressions if it's not ours.
      expr.visit_mut_children_with(self);
      return;
    }

    let array = Expr::Ident(self.ident.clone());

    let index = Expr::Lit(Lit::Num(Number {
      value: self.style_id() as f64,
      span: DUMMY_SP,
      raw: None,
    }));

    let index_expr = Expr::Member(MemberExpr {
      obj: Box::new(array),
      prop: MemberProp::Computed(ComputedPropName {
        span: Default::default(),
        expr: Box::new(index),
      }),
      span: DUMMY_SP,
    });

    *expr = index_expr;
  }

  fn visit_mut_module(&mut self, module: &mut Module) {
    self.ids = convert_import_map_to_ids(&self.config.import_map, module);

    module.visit_mut_children_with(self);
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
  pub import_map: Vec<common::config::ImportMap>,
}

#[plugin_transform]
pub fn process_transform(
  mut program: Program,
  metadata: TransformPluginProgramMetadata,
) -> Program {
  let config = serde_json::from_str::<Config>(&*metadata.get_transform_plugin_config().unwrap())
    .expect("invalid config");
  program.visit_mut_with(&mut CallCollector::new(config));
  program
}

#[cfg(test)]
mod tests {
  use super::*;
  use swc_core::common::chain;
  use swc_core::common::Mark;
  use swc_core::ecma::transforms::base::resolver;
  use swc_core::ecma::transforms::testing::test;
  use swc_core::ecma::visit::as_folder;
  use swc_core::ecma::visit::Fold;

  fn config() -> impl Fold {
    let config = r#"
      {
        "importMap": [
          {
            "callee": "style",
            "source": "@navita/css"
          },
          {
            "callee": "globalStyle",
            "source": "@navita/css"
          }
        ]
      }
    "#;

    chain!(
      resolver(Mark::new(), Mark::new(), false),
      as_folder(CallCollector::new(
        serde_json::from_str::<Config>(config.into()).expect("invalid config")
      ))
    )
  }

  test!(
    Default::default(),
    |_| config(),
    transformer_test,
    r#"
      import { style, globalStyle, merge } from "@navita/css";
      const something = style({ some: data });
      globalStyle({ hello: 'cool' });
      const hello = style({ other: { types: someData() } });
      const otherStuff = "hello";

      function coolStyleCallInside() {
        const wowSuperCool = style({ color: 'yellow' });
      }
    "#,
    r#"
      import { style, globalStyle, merge } from "@navita/css";
      const something = $$evaluatedValues[0];
      $$evaluatedValues[1];
      const hello = $$evaluatedValues[2];
      const otherStuff = "hello";

      function coolStyleCallInside() {
        const wowSuperCool = $$evaluatedValues[3];
      }
    "#
  );
}
