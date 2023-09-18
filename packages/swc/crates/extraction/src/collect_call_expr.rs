use swc_core::ecma::ast::{CallExpr};
use swc_core::{
  common::collections::AHashSet,
  ecma::visit::{Visit},
};

pub struct CallExprCollector {
  pub(crate) values: AHashSet<CallExpr>,
}

impl Visit for CallExprCollector {
  fn visit_call_expr(&mut self, call_expr: &CallExpr) {
    self.values.insert(call_expr.clone());
  }
}
