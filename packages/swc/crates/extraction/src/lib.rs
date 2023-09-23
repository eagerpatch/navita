mod collect_idents;
mod collect_statements;
mod collect_used_idents;
mod collect_call_expr;
mod get_char_pos_from_loc;

use crate::collect_statements::{collect_statements, CollectStatementResult};
use common::config::ImportMap;
use common::get_callee_ident::get_callee_ident;
use serde::Deserialize;
use std::sync::Arc;
use swc_common::{DUMMY_SP, SourceMapper, Spanned};
use swc_common::collections::AHashMap;
use swc_core::common::collections::AHashSet;
use swc_core::ecma::ast::{ArrowExpr, BlockStmtOrExpr, CallExpr, Callee, Expr, ExprOrSpread, Id, Ident, ImportDecl, ImportNamedSpecifier, ImportSpecifier, KeyValueProp, ModuleDecl, ModuleItem, ObjectLit, Prop, PropName, PropOrSpread, Str, ArrayLit, Lit, Number};
use swc_core::ecma::utils::{private_ident, quote_ident, quote_str};
use swc_core::plugin::metadata::TransformPluginMetadataContextKind;
use swc_core::{
  ecma::{
    ast::{Module, Program},
    visit::{VisitMut, VisitMutWith},
  },
  plugin::plugin_transform,
  plugin::proxies::TransformPluginProgramMetadata,
};
use crate::get_char_pos_from_loc::get_char_pos_from_loc;

struct Extractor {
  config: Config,
  file_name: String,
  import_calls: AHashSet<Id>,
  source_map: Arc<dyn SourceMapper>,
  index: usize,
  collect_result_name: &'static str,
  collect_result_ident: Ident,
  collect_result_source: &'static str,
  call_expr_map: AHashMap<CallExpr, Id>,
}

impl Extractor {
  fn new(config: Config, file_name: String, source_map: Arc<dyn SourceMapper>) -> Self {
    let collect_result_name = "collectResult";
    let collect_result_ident = private_ident!(collect_result_name);
    let collect_result_source = "@navita/adapter";

    Self {
      config,
      file_name,
      source_map,
      index: 0,
      import_calls: AHashSet::default(),
      collect_result_name,
      collect_result_ident,
      collect_result_source,
      call_expr_map: AHashMap::default(),
    }
  }
}

impl VisitMut for Extractor {
  fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
    let ident = get_callee_ident(call_expr);

    if ident.is_none() {
      return;
    }

    let ident = ident.unwrap();

    if !self.import_calls.contains(&ident.to_id()) {
      return;
    }

    let current_index = self.index;

    let line_col_start = self
      .source_map
      .lookup_char_pos(call_expr.span().lo());

    let line_col_end = self
      .source_map
      .lookup_char_pos(call_expr.span().hi());

    let pos_start = get_char_pos_from_loc(&line_col_start);
    let pos_end = get_char_pos_from_loc(&line_col_end);

    let identifier = self.call_expr_map.get(call_expr).map_or("".to_string(), |id| id.0.to_string());

    *call_expr = CallExpr {
      span: Default::default(),
      callee: Callee::Expr(Box::from(Expr::Ident(self.collect_result_ident.clone()))),
      args: vec![ExprOrSpread {
        spread: None,
        expr: Box::new(Expr::Object(ObjectLit {
          span: DUMMY_SP,
          props: vec![
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
              key: PropName::Ident(quote_ident!("filePath")),
              value: Box::new(Expr::Lit(quote_str!(*self.file_name).into())),
            }))),
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
              key: PropName::Ident(quote_ident!("index")),
              value: Box::new(Expr::Lit(current_index.into())),
            }))),
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
              key: PropName::Ident(quote_ident!("identifier")),
              value: Box::new(Expr::Lit(quote_str!(identifier).into())),
            }))),
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
              key: PropName::Ident(quote_ident!("position")),
              value: Box::new(Expr::Array(ArrayLit {
                span: Default::default(),
                elems: vec![
                  Some(ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Lit(Lit::Num(Number {
                      span: DUMMY_SP,
                      value: pos_start as f64,
                      raw: None,
                    }))),
                  }),
                  Some(ExprOrSpread {
                    spread: None,
                    expr: Box::new(Expr::Lit(Lit::Num(Number {
                      span: DUMMY_SP,
                      value: pos_end as f64,
                      raw: None,
                    }))),
                  }),
                ],
              })),
            }))),
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
              key: PropName::Ident(quote_ident!("sourceMap")),
              value: Box::new(Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: vec![
                  PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                    key: PropName::Ident(quote_ident!("line")),
                    value: Box::new(Expr::Lit(line_col_start.line.into())),
                  }))),
                  PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                    key: PropName::Ident(quote_ident!("column")),
                    value: Box::new(Expr::Lit(line_col_start.col_display.into())),
                  }))),
                ]
              }))
            }))),
            PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
              key: PropName::Ident(quote_ident!("result")),
              value: Box::new(Expr::Arrow(ArrowExpr {
                span: Default::default(),
                params: vec![],
                body: BlockStmtOrExpr::Expr(call_expr.clone().into()).into(),
                is_async: false,
                is_generator: false,
                type_params: None,
                return_type: None,
              })),
            }))),
          ],
        })),
      }],
      type_args: None,
    };

    // Also increment index for next call
    self.index += 1;
  }

  fn visit_mut_module(&mut self, module: &mut Module) {
    let CollectStatementResult {
      items,
      call_expr_map,
      import_calls,
    } = collect_statements(&self.config.import_map, &self.file_name, module);

    self.import_calls = import_calls;
    self.call_expr_map = call_expr_map;
    module.body = items;

    module.body.insert(
      0,
      ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
        span: Default::default(),
        specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
          span: Default::default(),
          local: self.collect_result_ident.clone().into(),
          imported: Some(quote_ident!(self.collect_result_name).into()),
          is_type_only: false,
        })],
        src: Box::new(Str {
          span: Default::default(),
          value: self.collect_result_source.into(),
          raw: None,
        }),
        type_only: false,
        asserts: None,
      })),
    );

    module.visit_mut_children_with(self);
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
  pub import_map: Vec<ImportMap>,
}

#[plugin_transform]
pub fn process_transform(
  mut program: Program,
  metadata: TransformPluginProgramMetadata,
) -> Program {
  let config = serde_json::from_str::<Config>(&*metadata.get_transform_plugin_config().unwrap())
    .expect("invalid config");

  let file_name = metadata
    .get_context(&TransformPluginMetadataContextKind::Filename)
    .unwrap();

  let source_map: Arc<dyn SourceMapper> = Arc::new(metadata.source_map);

  program.visit_mut_with(&mut Extractor::new(config, file_name, source_map));
  program
}

#[cfg(test)]
mod tests {
  use super::*;
  use swc_core::common::chain;
  use swc_core::common::Mark;
  use swc_core::ecma::transforms::base::resolver;
  use swc_core::ecma::transforms::testing::{test, Tester};
  use swc_core::ecma::visit::as_folder;
  use swc_core::ecma::visit::Fold;

  fn config(tester: &mut Tester) -> impl Fold {
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
          },
          {
            "callee": "createTheme",
            "source": "@navita/css"
          }
        ]
      }
    "#;

    chain!(
      resolver(Mark::new(), Mark::new(), false),
      as_folder(Extractor::new(
        serde_json::from_str::<Config>(config.into()).expect("invalid config"),
        "super-cool-filename".into(),
        tester.cm.clone()
      ))
    )
  }

  test!(
    Default::default(),
    config,
    handles_export_var_decl,
    r#"
      import { style } from "@navita/css";

      export const unused = true;
      export const tests = style({ color: 'red' });
      const something = style({ color: 'green' });
    "#,
    r#"
      import { collectResult as collectResult } from "@navita/adapter";
      import { style } from "@navita/css";
      export const tests = collectResult({
        filePath: "super-cool-filename",
        index: 0,
        identifier: "tests",
        position: [
          106,
          129
        ],
        sourceMap: {
          line: 5,
          column: 27
        },
        result: () => style({
          color: 'red'
        })
      });
      const something = collectResult({
        filePath: "super-cool-filename",
        index: 1,
        identifier: "something",
        position: [
          155,
          180
        ],
        sourceMap: {
          line: 6,
          column: 24
        },
        result: () => style({
          color: 'green'
        })
      });
    "#
  );

  test!(
    Default::default(),
    config,
    preserves_imports_when_none_found,
    r#"
      import { style } from "@navita/css";
      import { someImport } from "some-other-place";

      console.log(someImport);
    "#,
    r#"
      import { collectResult as collectResult } from "@navita/adapter";
      import { style } from "@navita/css";
      import { someImport } from "some-other-place";
    "#
  );

  test!(
    Default::default(),
    config,
    works_with_call_expressions,
    r#"
      import { globalStyle } from "@navita/css";

      globalStyle('body', {
        fontSize: '50px',
      });
    "#,
    r#"
      import { collectResult as collectResult } from "@navita/adapter";
      import { globalStyle } from "@navita/css";

      collectResult({
        filePath: "super-cool-filename",
        index: 0,
        identifier: "",
        position: [
          57,
          113
        ],
        sourceMap: {
          line: 4,
          column: 6
        },
        result: () => globalStyle('body', {
          fontSize: '50px',
        }),
      });
    "#
  );

  test!(
    Default::default(),
    config,
    works_with_both,
    r#"
      import { globalStyle, style } from "@navita/css";

      globalStyle('body', {
        color: 'purple',
      });

      const yellow = style({
        background: 'yellow',
      });
    "#,
    r#"
      import { collectResult as collectResult } from "@navita/adapter";
      import { globalStyle, style } from "@navita/css";

      collectResult({
        filePath: "super-cool-filename",
        index: 0,
        identifier: "",
        position: [
          64,
          119
        ],
        sourceMap: {
          line: 4,
          column: 6
        },
        result: () => globalStyle('body', {
          color: 'purple',
        }),
      });

      const yellow = collectResult({
        filePath: "super-cool-filename",
        index: 1,
        identifier: "yellow",
        position: [
          143,
          189
        ],
        sourceMap: {
          line: 8,
          column: 21
        },
        result: () => style({
          background: 'yellow',
        })
      });
    "#
  );

  test!(
    Default::default(),
    config,
    works_with_nested_hoisting,
    r#"
      import { globalStyle, createTheme, style as supercool } from "@navita/css";
      const preserved = 'hello';
      export const [vars] = createTheme({
       color: {
         red: 'purple',
         value: preserved,
         more: {
           stuff: 'heje',
         }
       },
      });

      const [hej, hejsan, tja] = [1, 2, 3];

      globalStyle('body', {
        color: vars.color.red,
        hej,
        hejsan,
        tja,
      });

      function hoisted(argName) {
        const wow = supercool({ color: 'blue', background: argName });
      }

      const also = () => {
        const hoistedAgain = supercool({ color: 'blue', background: 'red' });
      }
    "#,
    r#"
      import { collectResult as collectResult } from "@navita/adapter";
      import { globalStyle, createTheme, style as supercool } from "@navita/css";
      let argName;
      const preserved = 'hello';
      export const [vars] = collectResult({
        filePath: "super-cool-filename",
        index: 0,
        identifier: "vars",
        position: [
          144,
          297
        ],
        sourceMap: {
          line: 4,
          column: 28
        },
        result: () => createTheme({
          color: {
            red: 'purple',
            value: preserved,
            more: {
              stuff: 'heje'
            }
          }
        })
      });
      const [hej, hejsan, tja] = [1, 2, 3];
      collectResult({
        filePath: "super-cool-filename",
        index: 1,
        identifier: "",
        position: [
          351,
          454
        ],
        sourceMap: {
          line: 16,
          column: 6
        },
        result: () => globalStyle('body', {
          color: vars.color.red,
          hej,
          hejsan,
          tja
        })
      });
      const wow = collectResult({
        filePath: "super-cool-filename",
        index: 2,
        identifier: "wow",
        position: [
          511,
          560
        ],
        sourceMap: {
          line: 24,
          column: 20
        },
        result: () => supercool({
          color: 'blue',
          background: argName
        })
      });
      const hoistedAgain = collectResult({
        filePath: "super-cool-filename",
        index: 3,
        identifier: "hoistedAgain",
        position: [
          627,
          674
        ],
        sourceMap: {
          line: 28,
          column: 29
        },
        result: () => supercool({
          color: 'blue',
          background: 'red'
        })
      });
    "#
  );
}
