import React from 'react';

// Maps data keys to UI columns automatically
const SmartTable = ({ data, columns }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 1. Desktop View: Standard Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-4 font-medium text-gray-900">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-gray-600">
                    {/* If a custom render function is provided, use it; otherwise use simple text */}
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile View: Stacked Cards (Generated Automatically) */}
      <div className="md:hidden divide-y divide-gray-100">
        {data.map((row, i) => (
          <div key={i} className="p-4 flex flex-col gap-3">
            {columns.map((col, j) => (
              <div key={j} className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {col.header}
                </span>
                <span className="text-sm text-gray-800 text-right">
                   {col.render ? col.render(row) : row[col.accessor]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartTable;