use swc_core::ecma::ast::{CallExpr, Callee, Expr, Ident};

pub trait GetCalleeIdent {
  fn get_callee_ident(&self) -> Option<&Ident>;
}

impl GetCalleeIdent for Option<Box<Expr>> {
  fn get_callee_ident(&self) -> Option<&Ident> {
    if self.is_none() {
      return None;
    }

    return self.as_ref().unwrap().get_callee_ident();
  }
}

impl GetCalleeIdent for Box<Expr> {
  fn get_callee_ident(&self) -> Option<&Ident> {
    return self.unwrap_parens().get_callee_ident();
  }
}

impl GetCalleeIdent for Expr {
  fn get_callee_ident(&self) -> Option<&Ident> {
    if let Expr::Call(call_expr) = &self {
      return call_expr.get_callee_ident();
    }
    None
  }
}

impl GetCalleeIdent for CallExpr {
  fn get_callee_ident(&self) -> Option<&Ident> {
    if let Callee::Expr(expr) = &self.callee {
      if let Expr::Ident(ident) = &**expr {
        return Some(ident);
      }
    }
    None
  }
}

pub fn get_callee_ident<T: GetCalleeIdent>(expr: &T) -> Option<&Ident> {
  expr.get_callee_ident()
}
