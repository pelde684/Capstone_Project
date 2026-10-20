function Table({ columns, data }) {

  return (
    <div className="overflow-x-auto">

      <table className="w-full text-left">

        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">

            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-4 text-sm font-semibold text-slate-600"
              >
                {column.label}
              </th>
            ))}

          </tr>
        </thead>

        <tbody>

          {data.map((row, index) => (

            <tr
              key={index}
              className="border-b border-slate-100 hover:bg-slate-50"
            >

              {columns.map((column) => (

                <td
                  key={column.key}
                  className="px-6 py-4 text-sm"
                >
                  {column.render
                    ? column.render(row)
                    : row[column.key]}
                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default Table;