const debounce = function (func, delay) {
  let timeout

  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, arguments), delay)
  }
}

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
    this.renderData()
  }

  addHeadings() {
    this.headingRow = this.mountingElement.querySelector('thead>tr')

    this.headings.forEach(item => {
      this.headingRow.insertAdjacentHTML('beforeend', `
        <th data-id=${item.id} data-type=${item.type}>
          ${item.label}
          ${this.filterableColumns.includes(item.id) ? '<br><input>' : ''}
        </th>
      `)
    })

    this.addFilterListeners()
    this.addSortListeners()
  }

  renderData(areFiltersEmpty = true) {
    const tableBody = this.mountingElement.querySelector('tbody'),
      data = !areFiltersEmpty ? this.processedData : this.data

    tableBody.innerHTML = ''

    data.forEach(datum => {
      const tr = document.createElement('tr')
      tableBody.insertAdjacentElement('beforeend', tr)

      this.headings.forEach(heading => {
        tr.insertAdjacentHTML('beforeend', `
          <td>${datum[heading.id]}</td>
        `)
      })
    })
  }

  addFilterListeners() {
    this.headingRow.addEventListener('input', debounce(() => {
      const filterStrategies = this.filterableColumns.map(id => ({
        id,
        value: this.mountingElement.querySelector(`th[data-id="${id}"] input`).value
      })),
        areFiltersEmpty = (() => {
          let length = 0

          filterStrategies.forEach(strategy => {
            length += strategy.value.length
          })

          return !length
        })()

      this.processedData = this.data.filter(datum => {
        let pass = true

        for (let i = 0; i < filterStrategies.length; i++) {
          const strategy = filterStrategies[i]

          pass = pass && String(datum[strategy.id]).toLowerCase().trim()
            .includes(strategy.value.toLowerCase().trim())

          if (!pass) break
        }

        return pass
      })
      this.renderData(areFiltersEmpty)
    }, 400))
  }

  addSortListeners() {

  }
}