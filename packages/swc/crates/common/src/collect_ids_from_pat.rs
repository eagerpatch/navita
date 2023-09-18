use swc_core::ecma::ast::{
  ArrayPat, AssignPat, AssignPatProp, BindingIdent, Id, KeyValuePatProp, ObjectPat, ObjectPatProp,
  Pat, RestPat,
};

// Logic from
// https://github.com/swc-project/swc/blob/769ebaf7c3f0453d34024eddfa0080fd211b711d/crates/swc_ecma_lints/src/rules/prefer_const.rs#L111
pub fn collect_ids_from_pat(pat: &Pat) -> Vec<Id> {
  let mut ids = vec![];
  match pat {
    Pat::Ident(BindingIdent { id, .. }) => {
      ids.push(id.clone().into());
    }
    Pat::Assign(AssignPat { left, .. }) => {
      ids.extend(collect_ids_from_pat(left.as_ref()));
    }
    Pat::Array(ArrayPat { elems, .. }) => {
      elems.iter().flatten().for_each(|elem| {
        ids.extend(collect_ids_from_pat(elem));
      });
    }
    Pat::Object(ObjectPat { props, .. }) => {
      props.iter().for_each(|prop| match prop {
        ObjectPatProp::KeyValue(KeyValuePatProp { value, .. })
        | ObjectPatProp::Rest(RestPat { arg: value, .. }) => {
          ids.extend(collect_ids_from_pat(value.as_ref()));
        }
        ObjectPatProp::Assign(AssignPatProp { key, .. }) => {
          ids.push(key.clone().into());
        }
      });
    }
    Pat::Rest(RestPat { arg, .. }) => {
      ids.extend(collect_ids_from_pat(arg.as_ref()));
    }
    _ => {}
  };

  ids
}
