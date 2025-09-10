"use client";
import React, { useState, useEffect } from "react";
import { useProperty } from "../context/PropertyContext";
import { formatDate } from "../lib/clientUtils";

const PAGE_SIZE = 10;

const Report = () => {
  const { propertyId } = useProperty();
  const [report, setReport] = useState<
    {
      id: string;
      ticketNumber: string;
      patronName: string;
      placeToVisit: string;
      employeeName: string;
      date: string;
    }[]
  >([]);
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getReportData = async () => {
    const sendForm = {
      propertyId: propertyId,
      pageNumber,
      pageSize: PAGE_SIZE,
      filters: {
        search: search?.trim() as string,
      },
    };

    // console.log("Fetching report data with:", sendForm);

    const res = await fetch("/api/report/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendForm),
    });

    const data = await res.json();

    // console.log("Report data received:", data);

    const result = data?.result?.data || [];
    const total = data?.result?.total || result.length;

    setReport(result);
    setTotalPages(Math.ceil(total / PAGE_SIZE));
  };

  useEffect(() => {
    if (propertyId)
    setTimeout(() => {
      getReportData();
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageNumber, propertyId]);

  const handleSearchChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setSearch(e.target.value);
    setPageNumber(1); // Reset to page 1 on new search
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) setPageNumber(pageNumber + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Report
        </h1>

        {/* Search Bar */}
        <div className="mb-4 flex justify-center md:justify-center lg:justify-end text-gray-800">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 w-64"
          />
        </div>

        {/* Table */}
        {/* Table for desktop */}
        <div className="hidden sm:block overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Ticket #
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Patron
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Place
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {report.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.ticketNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {entry.patronName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {entry.placeToVisit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {entry.employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(entry.date)}
                  </td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-sm text-gray-500 py-6"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card layout */}
        <div className="sm:hidden space-y-4">
          {report.length > 0 ? (
            report.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-4 rounded shadow-md space-y-2 text-sm text-gray-800"
              >
                <div>
                  <span className="font-semibold text-gray-700">Ticket #:</span>{" "}
                  {entry.ticketNumber}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Patron:</span>{" "}
                  {entry.patronName}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Place:</span>{" "}
                  {entry.placeToVisit}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Employee:</span>{" "}
                  {entry.employeeName}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>{" "}
                  {formatDate(entry.date)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500">
              No records found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-gray-700 text-sm">
            Page {pageNumber} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={pageNumber === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;
