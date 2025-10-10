// src/components/admin/SalesReportsSection.jsx
import React, { useEffect, useState } from "react";
const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 
const SalesReportsSection = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reports/sales`)
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
