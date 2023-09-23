use swc_common::collections::AHashMap;
use crate::collect_used_idents::collect_used_idents;

use common::config::ImportMap;
use common::convert_import_map_to_id::convert_import_map_to_ids;
use common::get_callee_ident::get_callee_ident;
use swc_core::common::DUMMY_SP;
use swc_core::ecma::ast::{
  CallExpr, ClassDecl, Decl, ExportDecl, ExprStmt, FnDecl, Id, ImportDecl, Module, ModuleDecl,
  ModuleItem, Stmt, VarDecl, VarDeclKind, VarDeclarator,
};
use swc_core::ecma::utils::collect_decls;
use swc_core::{
  common::collections::AHashSet,
  ecma::visit::{noop_visit_type, Visit, VisitWith},
};
use crate::collect_call_expr::CallExprCollector;
use crate::collect_idents::collect_idents;

struct StatementCollector {
  // Import calls contains the list of call expressions that match the import_map
  import_calls: AHashSet<Id>,

  // This will be reduced while we visit the module.
  // The remaining idents will be created as vars.
  // It should most likely only be hoisted vars that we don't find in the code.
  used_idents: AHashSet<Id>,

  // created module items.
  module_items: Vec<ModuleItem>,

  // cloned module items that contain imports
  module_imports: Vec<ModuleItem>,

  // Map to convert call expressions to decl strings
  call_expr_map: AHashMap<CallExpr, Id>,
}

impl StatementCollector {
  fn visit_var_decl(&mut self, var_decl: &VarDecl) -> bool {
    let mut keep = false;

    for decl in var_decl.decls.iter() {
      let ident = get_callee_ident(&decl.init);

      if ident.is_some() {
        let ident = ident.unwrap();

        if self.import_calls.contains(&ident.to_id()) {
          keep = true;

          // Collect call expressions in the init
          let mut call_expr_collector = CallExprCollector {
            values: AHashSet::default(),
          };

          decl.init.visit_with(&mut call_expr_collector);

          let name_idents = collect_idents(&decl.name);

          // It's probably only going to be one, but we'll just loop through them.
          for call_expr in call_expr_collector.values {
            for ident in &name_idents {
              self.call_expr_map.insert(
                call_expr.clone(),
                ident.clone()
              );
            }
          }
        }
      }

      let known_decls: AHashSet<Id> = collect_decls(decl);

      for id in known_decls {
        if self.used_idents.contains(&id) {
          self.used_idents.remove(&id);
          keep = true;
        }
      }
    }

    keep
  }
}

impl Visit for StatementCollector {
  noop_visit_type!();

  fn visit_call_expr(&mut self, call_expr: &CallExpr) {
    let ident = get_callee_ident(call_expr);

    if ident.is_none() {
      return call_expr.visit_children_with(self);
    }

    let ident = ident.unwrap();

    if !self.import_calls.contains(&ident.to_id()) {
      return call_expr.visit_children_with(self);
    }

    self
      .module_items
      .push(ModuleItem::Stmt(Stmt::Expr(ExprStmt {
        span: DUMMY_SP,
        expr: call_expr.clone().into(),
      })));
  }

  fn visit_class_decl(&mut self, class_decl: &ClassDecl) {
    class_decl.visit_children_with(self);

    let id = class_decl.ident.to_id();

    if self.used_idents.contains(&id) {
      self
        .module_items
        .push(ModuleItem::Stmt(Stmt::Decl(Decl::Class(
          class_decl.clone().into(),
        ))));

      self.used_idents.remove(&id);
    }
  }

  fn visit_export_decl(&mut self, export_decl: &ExportDecl) {
    if let Decl::Var(var_decl) = &export_decl.decl {
      let keep = self.visit_var_decl(var_decl);

      if !keep {
        // Continue visiting the children
        return var_decl.visit_children_with(self);
      }

      self
        .module_items
        .push(ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(
          export_decl.clone().into(),
        )));
    } else {
      export_decl.visit_children_with(self);
    }
  }

  fn visit_fn_decl(&mut self, fn_decl: &FnDecl) {
    fn_decl.visit_children_with(self);

    let id = fn_decl.ident.to_id();

    if self.used_idents.contains(&id) {
      self.module_items.push(ModuleItem::Stmt(Stmt::Decl(Decl::Fn(
        fn_decl.clone().into(),
      ))));

      self.used_idents.remove(&id);
    }
  }

  fn visit_import_decl(&mut self, import_decl: &ImportDecl) {
    let specifiers = collect_decls(import_decl);

    for specifier in specifiers {
      self.used_idents.remove(&specifier);
    }

    // We just clone all import decls and keep them
    // The dce optimizer will clean up unused when we use it in javascript later.
    self
      .module_imports
      .push(ModuleItem::ModuleDecl(ModuleDecl::Import(
        import_decl.clone().into(),
      )));
  }

  fn visit_var_decl(&mut self, var_decl: &VarDecl) {
    let keep = self.visit_var_decl(var_decl);

    if !keep {
      // Continue visiting the children
      return var_decl.visit_children_with(self);
    }

    self
      .module_items
      .push(ModuleItem::Stmt(Stmt::Decl(Decl::Var(
        var_decl.clone().into(),
      ))));
  }
}

pub(crate) struct CollectStatementResult {
  pub(crate) items: Vec<ModuleItem>,
  pub(crate) call_expr_map: AHashMap<CallExpr, Id>,
  pub(crate) import_calls: AHashSet<Id>,
}

pub(crate) fn collect_statements(
  import_map: &Vec<ImportMap>,
  _file_name: &String,
  module: &Module,
) -> CollectStatementResult {
  let import_calls = convert_import_map_to_ids(import_map, module);
  let used_idents = collect_used_idents(&import_calls, module);

  let mut visitor = StatementCollector {
    import_calls,
    used_idents,
    call_expr_map: AHashMap::default(),
    module_items: vec![],
    module_imports: vec![],
  };

  module.visit_with(&mut visitor);

  // Create any leftover idents.
  for ident in visitor.used_idents {
    visitor.module_items.insert(
      0,
      ModuleItem::Stmt(Stmt::Decl(Decl::Var(Box::new(VarDecl {
        span: DUMMY_SP,
        // We don't have an init, so let or var.
        kind: VarDeclKind::Let,
        declare: false,
        decls: vec![VarDeclarator {
          span: DUMMY_SP,
          name: ident.into(),
          init: None,
          definite: false,
        }],
      })))),
    );
  }

  let mut result = Vec::new();
  result.extend(visitor.module_imports);
  result.extend(visitor.module_items);

  CollectStatementResult {
    items: result,
    call_expr_map: visitor.call_expr_map,
    import_calls: visitor.import_calls,
  }
}
