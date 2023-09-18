use crate::collect_idents::collect_idents;
use swc_core::ecma::ast::{CallExpr, Callee, Expr, Id, Module};
use swc_core::{
  common::collections::AHashSet,
  ecma::visit::{noop_visit_type, Visit, VisitWith},
};

pub struct CalleeCollector<'a> {
  calls: &'a AHashSet<Id>,
  idents: AHashSet<Id>,
}

impl Visit for CalleeCollector<'_> {
  noop_visit_type!();

  fn visit_call_expr(&mut self, call_expr: &CallExpr) {
    let callee = match &call_expr.callee {
      Callee::Expr(expr) => match &**expr {
        Expr::Ident(ident) => ident,
        _ => return,
      },
      _ => return,
    };

    if !self.calls.contains(&callee.to_id()) {
      return;
    }

    self.idents.extend(collect_idents(&call_expr.args));
  }
}

pub fn collect_used_idents(calls: &AHashSet<Id>, module: &Module) -> AHashSet<Id> {
  let mut v = CalleeCollector {
    calls,
    idents: Default::default(),
  };
  module.visit_with(&mut v);
  v.idents
}
