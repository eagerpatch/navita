/**
 * Unfortunately, we need to keep this list of compress options, since
 * SWC sets some defaults. For our project, we want to disable all, except for
 * unused.
 *
 * This list comes from the swc-playground:
 * @see https://github.com/swc-project/swc-playground/blob/3311f01c49a3c3a6c2f7ce8cbeda754e89bf644c/src/state.ts#L6
 *
 * We could:
 * - create a script that lets us keep this list updated.
 * - create a PR to swc to expose this list.
 * - implement the unused in our transformer.
 * - implement the dce in our transformer.
 *
 * @see https://github.com/swc-project/swc/blob/dada2d7d554fa0733a3c65c512777f1548d41a35/crates/swc_ecma_minifier/src/option/mod.rs#L114 */
export const defaultCompressOptions = {
  arguments: false,
  arrows: false,
  booleans: false,
  booleans_as_integers: false,
  collapse_vars: false,
  comparisons: false,
  computed_props: false,
  conditionals: false,
  dead_code: false,
  directives: false,
  drop_console: false,
  drop_debugger: false,
  evaluate: false,
  expression: false,
  hoist_funs: false,
  hoist_props: false,
  hoist_vars: false,
  if_return: false,
  join_vars: false,
  keep_classnames: false,
  keep_fargs: false,
  keep_fnames: false,
  keep_infinity: false,
  loops: false,
  negate_iife: false,
  properties: false,
  reduce_funcs: false,
  reduce_vars: false,
  side_effects: false,
  switches: false,
  typeofs: false,
  unsafe: false,
  unsafe_arrows: false,
  unsafe_comps: false,
  unsafe_Function: false,
  unsafe_math: false,
  unsafe_symbols: false,
  unsafe_methods: false,
  unsafe_proto: false,
  unsafe_regexp: false,
  unsafe_undefined: false,
  unused: false,
  const_to_let: false,
  pristine_globals: false,
}
