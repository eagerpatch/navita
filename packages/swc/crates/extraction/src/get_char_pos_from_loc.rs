use swc_common::Loc;

pub(crate) fn get_char_pos_from_loc(loc: &Loc) -> usize {
  // Get the starting BytePos of the line
  let line_start_byte_pos = loc.file.lines[loc.line - 1];

  // Calculate the offset from the start of the SourceFile
  let offset_from_file_start = line_start_byte_pos - loc.file.start_pos;

  // Calculate the byte count up to the offset
  let bytes_up_to_line = offset_from_file_start.0 as usize;

  // Use binary search to find the position where mbc.pos >= line_start_byte_pos
  let search_result = loc.file.multibyte_chars.binary_search_by(
    |mbc| mbc.pos.cmp(&line_start_byte_pos)
  );

  // Determine the end index for multi-byte characters to consider
  let index = match search_result {
    Ok(index) => index,
    Err(index) => index,
  };

  // Calculate the number of extra bytes from multi-byte characters up to the offset
  let extra_bytes_from_multibyte = loc.file.multibyte_chars[..index]
    .iter()
    .map(|mbc| (mbc.bytes - 1) as usize)
    .sum::<usize>();

  (bytes_up_to_line - extra_bytes_from_multibyte) + loc.col.0
}
