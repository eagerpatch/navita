use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ImportMap {
  pub callee: String,
  pub source: String,
}
