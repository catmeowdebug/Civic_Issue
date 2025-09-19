import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Pie, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";
import "./Dashboard.css"; // CSS only

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("unresolved");
    const [reports, setReports] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [assignInputs, setAssignInputs] = useState({}); // track department inputs

    // Fetch reports
    const fetchReports = async () => {
        try {
            const res = await axios.get("http://localhost:5000/reports");
            setReports(res.data || []);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    // Fetch community posts
    const fetchCommunityPosts = async () => {
        try {
            const res = await axios.get("http://localhost:5000/community");
            setCommunityPosts(res.data || []);
        } catch (err) {
            console.error("Error fetching community posts:", err);
        }
    };

    useEffect(() => {
        fetchReports();
        fetchCommunityPosts();
    }, []);

    // Resolve report
    const handleResolve = async (id) => {
        try {
            await axios.put(`http://localhost:5000/reports/${id}/resolve`);
            fetchReports();
        } catch (err) {
            console.error("Error resolving report:", err);
        }
    };

    // Assign report
    const handleAssign = async (id) => {
        const department = assignInputs[id];
        if (!department || department.trim() === "") {
            alert("Please enter a department name.");
            return;
        }

        try {
            await axios.put(`http://localhost:5000/reports/${id}/assign`, {
                department,
            });
            setAssignInputs((prev) => ({ ...prev, [id]: "" })); // clear input
            fetchReports();
            setActiveTab("assigned"); // switch to assigned tab automatically
        } catch (err) {
            console.error("Error assigning report:", err);
        }
    };

    // Delete report
    const handleDeleteReport = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/reports/${id}`);
            fetchReports();
        } catch (err) {
            console.error("Error deleting report:", err);
        }
    };

    // Delete community post
    const handleDeleteCommunity = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/community/${id}`);
            fetchCommunityPosts();
        } catch (err) {
            console.error("Error deleting community post:", err);
        }
    };

    // Render report cards
    const renderReports = (statusFilter) => {
        const filtered = reports.filter((r) => r.status === statusFilter);

        if (filtered.length === 0) {
            return <p className="no-data">No {statusFilter} reports found.</p>;
        }

        return filtered.map((report) => (
            <div key={report._id} className="card">
                <div>
                    <p className="card-title">{report.caption}</p>
                    {report.imageUrl && (
                        <img src={report.imageUrl} alt="report" className="card-img" />
                    )}
                    {report.address && <p className="card-address">{report.address}</p>}
                    {report.assignedDepartment && (
                        <p className="card-status">
                            Assigned to: {report.assignedDepartment}
                        </p>
                    )}
                </div>
                <div className="btn-group">
                    {statusFilter === "unresolved" && (
                        <>
                            {/* Assign input + button */}
                            <input
                                type="text"
                                placeholder="Enter department"
                                value={assignInputs[report._id] || ""}
                                onChange={(e) =>
                                    setAssignInputs((prev) => ({
                                        ...prev,
                                        [report._id]: e.target.value,
                                    }))
                                }
                                className="assign-input"
                            />
                            <button
                                className="btn btn-blue"
                                onClick={() => handleAssign(report._id)}
                            >
                                Assign
                            </button>

                            <button
                                className="btn btn-green"
                                onClick={() => handleResolve(report._id)}
                            >
                                Resolve
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-red"
                        onClick={() => handleDeleteReport(report._id)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ));
    };

    // ======== Analytics Data =========
    const issueCounts = {
        unresolved: reports.filter((r) => r.status === "unresolved").length,
        resolved: reports.filter((r) => r.status === "resolved").length,
        assigned: reports.filter((r) => r.status === "assigned").length,
    };

    const pieData = {
        labels: ["Unresolved", "Resolved", "Assigned"],
        datasets: [
            {
                data: [
                    issueCounts.unresolved,
                    issueCounts.resolved,
                    issueCounts.assigned,
                ],
                backgroundColor: ["#f87171", "#34d399", "#60a5fa"],
            },
        ],
    };

    const barData = {
        labels: ["Unresolved", "Resolved", "Assigned"],
        datasets: [
            {
                label: "Number of Issues",
                data: [
                    issueCounts.unresolved,
                    issueCounts.resolved,
                    issueCounts.assigned,
                ],
                backgroundColor: ["#f87171", "#34d399", "#60a5fa"],
            },
        ],
    };

    return (
        <div className="dashboard">
            <h1 className="dashboard-title">Dashboard</h1>

            {/* Tabs Navbar */}
            <div className="tab-bar">
                {["unresolved", "resolved", "assigned", "community", "map", "analytics"].map(
                    (tab) => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "unresolved"
                                ? "Unresolved Issues"
                                : tab === "resolved"
                                    ? "Resolved Issues"
                                    : tab === "assigned"
                                        ? "Assigned Issues"
                                        : tab === "community"
                                            ? "Community Posts"
                                            : tab === "map"
                                                ? "View Issues on Map"
                                                : "Analytics"}
                        </button>
                    )
                )}
            </div>

            {/* Tab content */}
            {activeTab === "unresolved" && (
                <div className="tab-content">{renderReports("unresolved")}</div>
            )}

            {activeTab === "resolved" && (
                <div className="tab-content">{renderReports("resolved")}</div>
            )}

            {activeTab === "assigned" && (
                <div className="tab-content">{renderReports("assigned")}</div>
            )}

            {activeTab === "community" && (
                <div className="tab-content">
                    {communityPosts.length === 0 ? (
                        <p className="no-data">No community posts found.</p>
                    ) : (
                        communityPosts.map((post) => (
                            <div key={post._id} className="card">
                                <div>
                                    <p className="card-title">{post.caption}</p>
                                    <p className="card-address">User ID: {post.userId}</p>
                                    {post.imageUrl && (
                                        <img
                                            src={post.imageUrl}
                                            alt="community post"
                                            className="card-img"
                                        />
                                    )}
                                    {post.address && (
                                        <p className="card-address">{post.address}</p>
                                    )}
                                </div>
                                <div className="btn-group">
                                    <button
                                        className="btn btn-red"
                                        onClick={() => handleDeleteCommunity(post._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === "map" && (
                <div className="map-container">
                    <MapContainer
                        center={[20, 78]}
                        zoom={5}
                        scrollWheelZoom={true}
                        className="map"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {reports
                            .filter((r) => r.latitude && r.longitude)
                            .map((report) => (
                                <Marker
                                    key={report._id}
                                    position={[report.latitude, report.longitude]}
                                >
                                    <Popup>
                                        <strong>{report.caption}</strong>
                                        <br />
                                        Status: {report.status}
                                        <br />
                                        {report.assignedDepartment && (
                                            <>
                                                Assigned to: {report.assignedDepartment}
                                                <br />
                                            </>
                                        )}
                                        {report.address}
                                    </Popup>
                                </Marker>
                            ))}
                    </MapContainer>
                </div>
            )}

            {activeTab === "analytics" && (
                <div className="tab-content analytics-container">
                    <h2>Issue Analytics</h2>
                    <div className="chart-wrapper">
                        <div className="chart-box">
                            <h3>Distribution (Pie)</h3>
                            <Pie data={pieData} />
                        </div>
                        <div className="chart-box">
                            <h3>Issues Count (Bar)</h3>
                            <Bar data={barData} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
