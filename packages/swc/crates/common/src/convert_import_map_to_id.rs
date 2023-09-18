use crate::config::ImportMap;
use swc_core::ecma::ast::{Id, ImportDecl, ImportSpecifier, Module, ModuleExportName};
use swc_core::{
  common::collections::AHashSet,
  ecma::visit::{noop_visit_type, Visit, VisitWith},
};

pub struct CalleeCollector<'a> {
  idents: AHashSet<Id>,
  import_map: &'a Vec<ImportMap>,
}

impl<'a> Visit for CalleeCollector<'a> {
  noop_visit_type!();

  fn visit_import_decl(&mut self, decl: &ImportDecl) {
    if decl.type_only {
      return;
    }

    for import in self.import_map.iter() {
      if decl.src.value == import.source {
        for specifier in decl.specifiers.iter() {
          match specifier {
            // import { default as __style } from '@navita/core'
            // import { __style } from '@navita/core'
            ImportSpecifier::Named(named) => {
              let name = import.callee.clone();
              let matched = match &named.imported {
                Some(imported) => match imported {
                  ModuleExportName::Ident(v) => v.sym.to_string() == name,
                  ModuleExportName::Str(v) => v.value.to_string() == name,
                },
                _ => named.local.as_ref() == name,
              };
              if matched {
                self.idents.insert(named.local.to_id());
              }
            }

            // Todo: handle these?
            // import something from 'something'
            ImportSpecifier::Default(_) => {}
            // import * as namespace from 'something'
            ImportSpecifier::Namespace(_) => {}
          }
        }
      }
    }
  }
}

pub fn convert_import_map_to_ids(import_map: &Vec<ImportMap>, module: &Module) -> AHashSet<Id> {
  let mut v = CalleeCollector {
    idents: Default::default(),
    import_map,
  };
  module.visit_with(&mut v);
  v.idents
}
