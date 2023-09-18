use std::hash::Hash;
use swc_core::ecma::ast::{Id, MemberExpr, MemberProp};
use swc_core::{
  common::collections::AHashSet,
  ecma::{
    ast::{Ident, KeyValueProp, PropName},
    utils::ident::IdentLike,
    visit::{noop_visit_type, Visit, VisitWith},
  },
};

pub struct IdentCollector<I>
where
  I: IdentLike + Eq + Hash + Send + Sync,
{
  idents: AHashSet<I>,
}

impl<I> Visit for IdentCollector<I>
where
  I: IdentLike + Eq + Hash + Send + Sync,
{
  noop_visit_type!();

  fn visit_ident(&mut self, ident: &Ident) {
    self.idents.insert(I::from_ident(ident));
  }

  fn visit_key_value_prop(&mut self, key_value_prop: &KeyValueProp) {
    if let PropName::Computed(_) = key_value_prop.key {
      key_value_prop.key.visit_with(self);
    }

    key_value_prop.value.visit_with(self);
  }

  fn visit_member_expr(&mut self, member_expr: &MemberExpr) {
    if let MemberProp::Computed(_) = member_expr.prop {
      member_expr.prop.visit_with(self);
    }

    member_expr.obj.visit_with(self);
  }
}

pub fn collect_idents<N>(n: &N) -> AHashSet<Id>
where
  N: VisitWith<IdentCollector<Id>>,
{
  let mut v = IdentCollector {
    idents: Default::default(),
  };
  n.visit_with(&mut v);
  v.idents
}
