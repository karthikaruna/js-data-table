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
    this.pageLimitOptions = config.pageLimitOptions
    this.pageLimit = config.pageLimit

    this.mountTable()
    this.addHeadings()
    if (this.isPaginated) this.addPageLimitListeners()
    this.addPageSelectListener()
    this.addFilterListeners()
    this.addSortListeners()
    this.addSearchListener()

    if (this.isPaginated)
      this.paginate()
    else
      this.renderData()
  }

  mountTable() {
    this.mountingElement.insertAdjacentHTML('beforeend', `
      <div id="table-controls">
        ${this.isPaginated ? `
          <div>
            <label for="page-limit">Items to display</label>
            <select id="page-limit">
              ${this.pageLimitOptions
          .map(item => `<option ${this.pageLimit === item ? 'selected' : ''}>${item}</option>`)
          .join('')}
            </select>
          </div>
        ` : ''}
        <input id="search-all" placeholder="Search everything">
      </div>
      <div id="table-wrapper">
        <table class="${this.isHeaderFixed && 'sticky-header'} 
          ${this.sortableColumns && this.sortableColumns.length && 'sortable'} 
          ${this.isPaginated && 'paginated'}">
          <thead>
            <tr></tr>
          </thead>
          <tbody></tbody>
        </table>
        <p id="no-results">No data found</p>
      </div>
      <br>
      <p id="page-description"></p>
      <ul id="pager"></ul>
    `)
  }

  addHeadings() {
    this.headingRow = this.mountingElement.querySelector('thead>tr')

    this.headings.forEach(item => {
      this.headingRow.insertAdjacentHTML('beforeend', `
        <th data-id=${item.id} data-type=${item.type}>
          ${item.label} <span class="sort-order"></span>
          ${this.filterableColumns.includes(item.id) ? '<br><input placeholder="All">' : ''}
        </th>
      `)
    })
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

    const table = this.mountingElement.querySelector('table')

    table.classList.remove('empty')
    if (!data.length) table.classList.add('empty')
  }

  addPageLimitListeners() {
    const pageLimit = this.mountingElement.querySelector('select')

    pageLimit.addEventListener('change', event => {
      this.pageLimit = Number(event.target.value)
      this.paginate()
    })
  }

  addPageSelectListener() {
    const pager = this.mountingElement.querySelector('#pager')

    pager.addEventListener('click', event => {
      if (event.target.matches('li')) {
        this.setPage(Number(event.target.innerText.trim()))
      }
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

      if (this.isPaginated)
        this.paginate(!accumulatedFilterLength ? this.data : this.filteredData)
      else
        this.renderData(!accumulatedFilterLength ? this.data : this.filteredData)
    }, 300))
  }

  addSortListeners() {
    this.headingRow.addEventListener('click', event => {
      if (event.target.matches('th') && this.sortableColumns.includes(event.target.dataset.id)) {
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

        if (this.isPaginated)
          this.paginate(sortedData)
        else
          this.renderData(sortedData)

        Array.from(this.mountingElement.querySelectorAll('.sort-order')).forEach(item => item.innerHTML = '')
        target.querySelector('.sort-order').innerHTML = this.sortStrategy.sortOrder === 'ASC'
          ? '&uarr;'
          : '&darr;'
      }
    })
  }

  addSearchListener() {
    this.mountingElement.querySelector('#search-all')
      .addEventListener('input', debounce(event => {
        const ids = this.headings.map(heading => heading.id),
          searchResults = (this.filteredData && this.filteredData.length ? this.filteredData : this.data)
            .filter(datum => (
              ids.some(id => (
                String(datum[id]).toLowerCase().trim().includes(event.target.value.toLowerCase().trim())
              ))
            ))

        if (this.isPaginated)
          this.paginate(!event.target.value ? this.data : searchResults)
        else
          this.renderData(!event.target.value ? this.data : searchResults)
      }, 300))
  }

  paginate(passedData) {
    const data = passedData || this.data
    this.paginatedData = []

    for (let i = 0; i < data.length; i += this.pageLimit)
      this.paginatedData.push(data.slice(i, i + this.pageLimit))

    const pager = this.mountingElement.querySelector('#pager')

    pager.innerHTML = ''
    this.paginatedData.forEach((page, index) => {
      const li = document.createElement('li')

      li.innerText = index + 1
      pager.insertAdjacentElement('beforeend', li)
    })

    this.setPage()
  }

  setPage(number) {
    this.page = number || 1
    this.renderData(this.paginatedData[this.page - 1] || [])

    const pageDescription = this.mountingElement.querySelector('#page-description'),
      activePage = this.mountingElement.querySelector('#pager li.active'),
      currentPage = this.mountingElement.querySelector(`#pager li:nth-child(${this.page})`)

    try {
      const itemsInLastPage = this.paginatedData[this.paginatedData.length - 1].length,
        totalItems = (this.paginatedData.length - 1) * this.pageLimit + itemsInLastPage,
        startItemNumber = this.page === 1 ? 1 : (this.page - 1) * this.pageLimit + 1,
        endItemNumber = this.page === this.paginatedData.length ? totalItems : this.page * this.pageLimit

      pageDescription.innerText = `Displaying ${startItemNumber} to ${endItemNumber} of ${totalItems}`
    } catch {
      pageDescription.innerText = ''
    }

    activePage && activePage.classList.remove('active')
    currentPage && currentPage.classList.add('active')
  }
}