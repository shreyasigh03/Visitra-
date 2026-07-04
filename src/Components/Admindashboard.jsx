import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import React from 'react'
import { MdOutlinePendingActions } from "react-icons/md";
import Adminnavbar from './Adminnavbar';
import { RiGroupFill } from "react-icons/ri";
import { API_BASE_URL } from "../config";

//deploy krne ke lie api)uri add krdia h local host hta dia hai
const Admindashboard = () => {

  const [visitors, setVisitors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const itemsPerPage = 5;
  const totalVisits = visitors.length;
  const pendingRequests = visitors.filter(v => v.status === "pending").length;
  const approvedCount = visitors.filter(v => v.status === "approved").length;
  const rejectedCount = visitors.filter(v => v.status === "rejected").length;
  const todayDate = new Date().toISOString().split("T")[0];
  const todayVisits = visitors.filter(v => (v.date || "").startsWith(todayDate)).length;
  // const approvalRate = totalVisits
  //   ? ((approvedCount / totalVisits) * 100).toFixed(1)
  //   : 0;

  // const aiInsight = approvalRate >= 70
  //   ? "High visitor approval rate detected"
  //   : "Review visitor approval patterns";

  // const riskLevel =
  //   rejectedCount > approvedCount / 2
  //     ? "HIGH"
  //     : "LOW";

  // const aiRecommendation =
  //   riskLevel === "HIGH"
  //     ? "Monitor visitor approvals closely."
  //     : "No unusual activity detected.";
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectVisitor, setRejectVisitor] = useState(null);
  const [rejectMsg, setRejectMsg] = useState("");
  

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/visitor/all`)
      .then(res => res.json())
      .then(data => setVisitors(data))
      .catch(err => console.log(err));
  }, []);


  const filteredVisitors = visitors.filter(v => {
    const date = v.date || "";

    if (filter === "today") {
      return date.startsWith(todayDate);
    }

    if (filter === "range") {
      const fromMatch = fromDate ? date >= fromDate : true;
      const toMatch = toDate ? date <= toDate : true;
      return fromMatch && toMatch;
    }

    const statusMatch = filter === "all" || (v.status || "pending") === filter;
    return statusMatch;
  });

  const searchedVisitors = filteredVisitors.filter(v =>
    (v.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const sortedVisitors = [...searchedVisitors].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sort === "latest" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedVisitors.length / itemsPerPage);

  const paginatedVisitors = sortedVisitors.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const updateStatus = async (id, status, message = "") => {
    // instant UI update (no wait)
    setVisitors(prev =>
      prev.map(v =>
        v._id === id ? { ...v, status } : v
      )
    );

    if (status === "approved") {
      setSuccessMsg("Visitor Approved & Email Sent ✔");
      setTimeout(() => setSuccessMsg(""), 2000);
    }

    try {
      await fetch(`${API_BASE_URL}/api/visitor/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, message })
      });
    } catch (err) {
      console.log(err);
    }
  };

  const verifyPass = async () => {
    if (!verifyId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/visitor/verify/${verifyId}`);
      const data = await res.json();

      if (data.status === "valid") {
        if (data.visitor.status === "approved") {
          setVerifyResult({ type: "valid", visitor: data.visitor });
        } else {
          setVerifyResult({ type: "not-approved", visitor: data.visitor });
        }
      } else {
        setVerifyResult({ type: "invalid" });
      }
    } catch (err) {
      console.log(err);
      setVerifyResult({ type: "error" });
    }
  };


  if (!localStorage.getItem("isAdmin")) {
    return <Navigate to="/AdminLogin" replace />;
  }

  return (
    <div>


      <Adminnavbar/>


        <h1 className='text-[200%] my-2 ml-[5%] font-bold'>Dashboard</h1>
        {/* //cards */}

      <div className="card flex justify-between mx-[5%] gap-3">

        {/* //jo bhi user plan krega visit uski request idhr cnt hgi */}
        <div className='bg-[var(--bg-color)] p-4 w-[16%] min-h-[110px] rounded-2xl shadow-sm hover:shadow-md transition flex items-center'>
          <MdOutlinePendingActions className='text-[220%] mr-2 opacity-80'/>
          <div>
            <h1 className='text-sm font-medium'>Pending Request</h1>
            <p className='text-2xl font-bold mt-1'>{pendingRequests}</p>
          </div>
        </div>

        <div className='bg-[var(--bg-color)] p-4 w-[16%] min-h-[110px] rounded-2xl shadow-sm hover:shadow-md transition flex items-center'>
          <RiGroupFill className='text-[220%] mr-2 opacity-80'/>
          <div className='ml-2'>
            <h1 className='text-sm font-medium'>Total Visits</h1>
            <p className='text-2xl font-bold mt-1'>{totalVisits}</p>
          </div>
        </div>

        <div className='bg-[var(--bg-color)] p-4 w-[16%] min-h-[110px] rounded-2xl shadow-sm hover:shadow-md transition flex items-center'>
          <RiGroupFill className='text-[220%] mr-2 opacity-80'/>
          <div className='ml-2'>
            <h1 className='text-sm font-medium'>Approved</h1>
            <p className='text-2xl font-bold mt-1'>{approvedCount}</p>
          </div>
        </div>

        <div className='bg-[var(--bg-color)] p-4 w-[16%] min-h-[110px] rounded-2xl shadow-sm hover:shadow-md transition flex items-center'>
          <RiGroupFill className='text-[220%] mr-2 opacity-80'/>
          <div className='ml-2'>
            <h1 className='text-sm font-medium'>Rejected</h1>
            <p className='text-2xl font-bold mt-1'>{rejectedCount}</p>
          </div>
        </div>

        <div className='bg-[var(--bg-color)] p-4 w-[16%] min-h-[110px] rounded-2xl shadow-sm hover:shadow-md transition flex items-center'>
          <RiGroupFill className='text-[220%] mr-2 opacity-80'/>
          <div className='ml-2'>
            <h1 className='text-sm font-medium'>Today Visits</h1>
            <p className='text-2xl font-bold mt-1'>{todayVisits}</p>
          </div>
        </div>

      </div>
{/* 
      <div className="mx-[5%] mt-4 bg-white/90 border border-gray-200 rounded-2xl shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">AI Visitor Analytics</h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-600">Approval Rate</p>
            <p className="text-xl font-bold mt-1">{approvalRate}%</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-100">
            <p className="text-sm text-gray-600">Approved Visitors</p>
            <p className="text-xl font-bold mt-1">{approvedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl border border-yellow-100">
            <p className="text-sm text-gray-600">Today's Visitors</p>
            <p className="text-xl font-bold mt-1">{todayVisits}</p>
          </div>
        </div> */}

        {/* <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border text-sm">
          <strong>AI Insight:</strong> {aiInsight}
        </div>

        <div className="mt-2 p-2.5 bg-red-50 rounded-xl border text-sm">
          <strong>Risk Level:</strong> {riskLevel}
        </div>

        <div className="mt-2 p-2.5 bg-blue-50 rounded-xl border text-sm">
          <strong>AI Recommendation:</strong> {aiRecommendation}
        </div>
      </div> */}

       <div className="flex justify-between items-center mt-[3%] mx-[5%]">
  <h1 className='text-[150%] font-bold'>VISITORS</h1>

  <div className="flex items-center gap-3">
    <input
      type="text"
      placeholder="Search by name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border p-2 w-[220px] rounded text-sm"
    />

    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="border p-2 rounded text-sm bg-white"
    >
      <option value="all">All</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
      <option value="today">Today</option>
      <option value="range">Date Range</option>
    </select>
    {filter === "range" && (
      <>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded text-sm"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-2 rounded text-sm"
        />
      </>
    )}
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
      className="border p-2 rounded text-sm bg-white"
    >
      <option value="latest">Latest</option>
      <option value="oldest">Oldest</option>
    </select>
    <input
      type="text"
      placeholder="Enter Pass ID"
      value={verifyId}
      onChange={(e) => setVerifyId(e.target.value)}
      className="border p-2 w-[180px] rounded text-sm"
    />

    <button
      onClick={verifyPass}
      className="px-3 py-2 bg-blue-200 text-blue-800 rounded text-sm"
    >
      Verify
    </button>
  </div>
</div>
{verifyResult && (
  <div className={`mx-[5%] mt-2 p-3 rounded ${
    verifyResult.type === "valid"
      ? "bg-green-100 text-green-800"
      : verifyResult.type === "not-approved"
      ? "bg-yellow-100 text-yellow-800"
      : verifyResult.type === "invalid"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-600"
  }`}>
    {verifyResult.type === "valid" && (
      <div>
        <p><strong>VALID ENTRY</strong></p>
        <p>Name: {verifyResult.visitor.name}</p>
        <p>Status: {verifyResult.visitor.status}</p>
        <p>Email: {verifyResult.visitor.email}</p>
        <p>Phone: {verifyResult.visitor.phone}</p>
      </div>
    )}

    {verifyResult.type === "not-approved" && (
      <div>
        <p><strong>NOT APPROVED</strong></p>
        <p>Name: {verifyResult.visitor.name}</p>
        <p>Status: {verifyResult.visitor.status}</p>
      </div>
    )}

    {verifyResult.type === "invalid" && <p>INVALID PASS</p>}
  </div>
)}
      {rejectVisitor && (
        <div className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-xl z-50 p-5 overflow-y-auto">

          <button
            onClick={() => {
              setRejectVisitor(null);
              setRejectMsg("");
            }}
            className="absolute top-3 right-3 text-gray-500"
          >
            ✕
          </button>

          <h2 className="text-lg font-bold mb-4">Reject Visitor</h2>

          <textarea
            placeholder="Optional message..."
            value={rejectMsg}
            onChange={(e) => setRejectMsg(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          />

          <button
            onClick={() => {
              updateStatus(rejectVisitor._id, "rejected", rejectMsg);
              setRejectVisitor(null);
              setRejectMsg("");
            }}
            className="bg-red-200 px-3 py-2 rounded w-full"
          >
            Send & Reject
          </button>

        </div>
      )}
      {successMsg && (
        <div className="fixed top-5 right-5 bg-green-200 text-green-800 px-4 py-2 rounded shadow-lg z-50">
          {successMsg}
        </div>
      )}
      <div className="mx-[5%] my-[2%] w-[90%] border rounded-xl shadow-sm p-5 overflow-x-auto bg-white">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-2 border">Pass ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">To Meet</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedVisitors.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center p-4 text-gray-500">
                  No results found
                </td>
              </tr>
            )}
            {paginatedVisitors.map((v, i) => (
              <tr key={i} className="text-center">
                <td className="p-2 border">{v.passId}</td>
                <td className="p-2 border relative">
                  <span>{v.name || "-"}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedVisitor(v); }}
                    className="absolute top-1 right-1 text-xs bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center"
                    title="View details"
                  >
                    i
                  </button>
                </td>
                <td className="p-2 border">{v.email || "-"}</td>
                <td className="p-2 border">{v.phone || "-"}</td>
                <td className="p-2 border">{v.toMeet || "-"}</td>
                <td className="p-2 border">
                  {v.date && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : "-"}
                </td>
                <td className="p-2 border">
                  <span className={
                    (v.status === "approved" ? "bg-green-200 text-green-800" :
                     v.status === "rejected" ? "bg-red-200 text-red-800" :
                     "bg-yellow-200 text-yellow-800") + " px-2 py-1 rounded"
                  }>
                    {v.status || "pending"}
                  </span>
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => {
                      setVerifyId(v.passId);
                      setTimeout(() => verifyPass(), 100);
                    }}
                    className="px-2 py-1 mr-2 rounded bg-blue-200 text-blue-800"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => updateStatus(v._id, "approved")}
                    disabled={v.status === "approved"}
                    className={`px-2 py-1 mr-2 rounded ${
                      v.status === "approved"
                        ? "bg-green-100 text-green-400 cursor-not-allowed"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectVisitor(v)}
                    disabled={v.status === "rejected"}
                    className={`px-2 py-1 rounded ${
                      v.status === "rejected"
                        ? "bg-red-100 text-red-400 cursor-not-allowed"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-2 py-1 text-sm">
            Page {page} of {totalPages || 1}
          </span>

          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      {selectedVisitor && (
        <div className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-xl z-50 p-5 overflow-y-auto">
          <button
            onClick={() => setSelectedVisitor(null)}
            className="absolute top-3 right-3 text-gray-500"
          >
            ✕
          </button>

          <h2 className="text-lg font-bold mb-4">Visitor Details</h2>

          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {selectedVisitor.name || "-"}</p>
            <p><strong>Email:</strong> {selectedVisitor.email || "-"}</p>
            <p><strong>Phone:</strong> {selectedVisitor.phone || "-"}</p>
            <p><strong>Host:</strong> {selectedVisitor.toMeet || "-"}</p>
            <p><strong>Date:</strong> {selectedVisitor.date || "-"}</p>
            <p>
              <strong>Time:</strong> {
                selectedVisitor.time
                || (selectedVisitor.createdAt ? selectedVisitor.createdAt.split("T")[1]?.slice(0,5) : "-")
              }
            </p>
            <p><strong>Status:</strong> {selectedVisitor.status || "pending"}</p>
            <p><strong>Pass ID:</strong> {selectedVisitor.passId || "-"}</p>
          </div>

          <button
            onClick={() => window.location.href = `mailto:${selectedVisitor.email}`}
            className="mt-4 w-full py-2 bg-blue-200 text-blue-800 rounded"
          >
            Send Email
          </button>
        </div>
      )}
    </div>
  )
}

export default Admindashboard
