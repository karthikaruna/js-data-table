fetch('https://restcountries.eu/rest/v2/all')
  .then(response => response.json())
  .then(data => {
    new DataTable({
      mountingElement: document.querySelector('#data-table-mount'),
      headings: [
        {
          id: 'name',
          type: 'string',
          label: 'Name'
        },
        {
          id: 'capital',
          type: 'string',
          label: 'Capital'
        },
        {
          id: 'region',
          type: 'string',
          label: 'Region'
        },
        {
          id: 'population',
          type: 'number',
          label: 'Population'
        },
        {
          id: 'area',
          type: 'number',
          label: 'Area'
        }
      ],
      data,
      sortableColumns: ['name', 'capital', 'region', 'population', 'area'],
      filterableColumns: ['name', 'capital', 'region', 'population', 'area'],
      isHeaderFixed: true,
      isPaginated: true,
      pageLimitOptions: [10, 20, 30, 40, 50, 60, 70],
      pageLimit: 50
    })
  })