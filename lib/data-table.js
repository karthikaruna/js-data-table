class DataTable {
  constructor(config) {
    this.mountingElement = config.mountingElement
    this.headings = config.headings
    this.data = config.data
    this.sortableColumns = config.sortableColumns
    this.filterableColumns = config.filterableColumns
    this.isHeaderFixed = config.isHeaderFixed
    this.isPaginated = config.isPaginated

    this.mountTable()
  }

  mountTable() {
    this.mountingElement.insertAdjacentHTML('beforeend', `
      <table class="${this.isHeaderFixed && 'sticky-header'}">
        <thead>
          <tr></tr>
        </thead>
        <tbody></tbody>
      </table>
    `)

    this.addHeadings()
    this.addRows()
  }

  addHeadings() {
    const headingRow = this.mountingElement.querySelector('thead>tr')

    this.headings.forEach(item => {
      headingRow.insertAdjacentHTML('beforeend', `
        <th data-id=${item.id} data-type=${item.type}>
          ${item.label}
          ${this.filterableColumns.includes(item.id) ? '<br><input>' : ''}
        </th>
      `)
    })
  }

  addRows() {
    const tableBody = this.mountingElement.querySelector('tbody')

    this.data.forEach(datum => {
      const tr = document.createElement('tr')
      tableBody.insertAdjacentElement('beforeend', tr)

      this.headings.forEach(heading => {
        tr.insertAdjacentHTML('beforeend', `
          <td>${datum[heading.id]}</td>
        `)
      })
    })
  }
}