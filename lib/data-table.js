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
      <table class="${this.isHeaderFixed && 'sticky-header'} 
        ${this.sortableColumns && this.sortableColumns.length && 'sortable'}">
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
          ${item.label} <span class="sort-order"></span>
          ${this.filterableColumns.includes(item.id) ? '<br><input>' : ''}
        </th>
      `)
    })

    this.addFilterListeners()
    this.addSortListeners()
  }

  renderData(passedData) {
    const tableBody = this.mountingElement.querySelector('tbody'),
      data = passedData || this.data

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
      let accumulatedFilterLength = 0
      const filterStrategies = this.filterableColumns.map(id => {
        const value = this.mountingElement.querySelector(`th[data-id="${id}"] input`).value

        accumulatedFilterLength += value.length

        return { id, value }
      })

      this.filteredData = this.data.filter(datum => {
        let pass = true

        for (let i = 0; i < filterStrategies.length; i++) {
          const strategy = filterStrategies[i]

          pass = pass && String(datum[strategy.id]).toLowerCase().trim()
            .includes(strategy.value.toLowerCase().trim())

          if (!pass) break
        }

        return pass
      })

      this.renderData(!accumulatedFilterLength ? this.data : this.filteredData)
    }, 300))
  }

  addSortListeners() {
    this.headingRow.addEventListener('click', event => {
      if (event.target.matches('th')) {
        const { target } = event

        this.sortStrategy = {
          id: target.dataset.id,
          type: target.dataset.type,
          sortOrder: (() => {
            if (!this.sortStrategy) {
              return 'ASC'
            } else {
              if (this.sortStrategy.sortOrder === 'ASC') {
                return 'DESC'
              }
              return 'ASC'
            }
          })()
        }

        const sortedData = (this.filteredData && this.filteredData.length ? this.filteredData : this.data)
          .sort((a, b) => {
            if (this.sortStrategy.type === 'number') {
              if (this.sortStrategy.sortOrder === 'ASC') {
                return a[this.sortStrategy.id] - b[this.sortStrategy.id]
              }
              return b[this.sortStrategy.id] - a[this.sortStrategy.id]
            } else {
              const comparison = a[this.sortStrategy.id].localeCompare(b[this.sortStrategy.id])

              if (this.sortStrategy.sortOrder === 'ASC') {
                return comparison
              }
              return -comparison
            }
          })

        this.renderData(sortedData)

        Array.from(this.mountingElement.querySelectorAll('.sort-order')).forEach(item => item.innerHTML = '')
        target.querySelector('.sort-order').innerHTML = this.sortStrategy.sortOrder === 'ASC'
          ? '&uarr;'
          : '&darr;'
      }
    })
  }
}