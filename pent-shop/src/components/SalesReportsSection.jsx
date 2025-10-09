// src/components/admin/SalesReportsSection.jsx
import React, { useEffect, useState } from "react";

const SalesReportsSection = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5001/api/reports/sales")
      .then((res) => res.json())
      .then((data) => setReport(data));
  }, []);

  if (!report) return <p>Loading report...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sales Report</h2>
      <p>Total Sales: ${report.totalSales}</p>
      <p>Total Orders: {report.totalOrders}</p>
      <p>Average Order Value: ${report.avgOrderValue}</p>
    </div>
  );
};

export default SalesReportsSection;
