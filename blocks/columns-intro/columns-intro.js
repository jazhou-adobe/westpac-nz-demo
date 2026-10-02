/**
 * Columns (intro) — section heading on the left, intro copy (with inline links) on the right.
 * Content contract: one row, two cells: cell 1 heading, cell 2 paragraph(s).
 * A single merged cell is split at its first heading; extra cells are kept as extra columns.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-intro-row');
    let cells = [...row.children];

    // authored as one cell: split the leading heading into its own column
    if (cells.length === 1) {
      const heading = cells[0].querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
      if (heading && cells[0].children.length > 1) {
        const headingCell = document.createElement('div');
        headingCell.append(heading);
        row.prepend(headingCell);
        cells = [...row.children];
      }
    }

    cells.forEach((cell, i) => {
      cell.classList.add(i === 0 ? 'columns-intro-heading-col' : 'columns-intro-text-col');
    });
  });
}
