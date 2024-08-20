import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Tooltip from "@mui/material/Tooltip";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	CircularProgress,
	TextField,
	Checkbox,
	FormControlLabel,
	FormGroup,
	IconButton,
	Box,
	Typography,
	Button,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import constants from "../constants";
const { RECENT_CHANGE_URI, THROTTLING_TIME_IN_MS, DATA_SLICE_LIMIT } = constants;

// CUSTOM HOOK
const useEventSource = (url) => {
	const [data, setData] = useState([]);
	const lastExecuted = useRef(0);

	useEffect(() => {
		const eventSource = new EventSource(url);

		eventSource.onmessage = (event) => {
			const now = Date.now();
			if (now - lastExecuted.current >= THROTTLING_TIME_IN_MS) {
				lastExecuted.current = now;
				const parsedData = JSON.parse(event.data);

				setData((prevData) => {
					const updatedRecord = {
						id: parsedData.meta.id,
						domain: parsedData.meta.domain,
						title: parsedData.title,
						type: parsedData.type,
						comment: parsedData.comment,
						user: parsedData.user,
						bot: parsedData.bot,
						minor: parsedData.minor,
						namespace: parsedData.namespace,
						seen: prevData.find((record) => record.id === parsedData.meta.id)?.seen || false,
					};

					return [updatedRecord, ...prevData].slice(0, DATA_SLICE_LIMIT);
				});
			}
		};

		return () => {
			eventSource.close();
		};
	}, [url]);

	return data;
};

// TABLE
const RealTimeTable = ({ data, onMarkSeen, filters, onFilterChange, onClearFilters, uniqueDomains }) => {
	const lowerDomain = filters.domain.toLowerCase();
	const lowerTitle = filters.title.toLowerCase();
	const lowerUser = filters.user.toLowerCase();
	const lowerSearchText = filters.searchText.toLowerCase();

	const filteredData = data.filter((record) => {
		const lowerRecordDomain = record.domain?.toLowerCase() || "";
		const lowerRecordTitle = record.title?.toLowerCase() || "";
		const lowerRecordUser = record.user?.toLowerCase() || "";
		const lowerRecordType = record.type?.toLowerCase() || "";
		const lowerRecordComment = record.comment?.toLowerCase() || "";

		return (
			(filters.editsOnly ? record.type === "edit" : true) &&
			(lowerRecordDomain.includes(lowerDomain) || filters.domain === "") &&
			(lowerRecordTitle.includes(lowerTitle) || filters.title === "") &&
			(lowerRecordUser.includes(lowerUser) || filters.user === "") &&
			(filters.bot === null || record.bot === filters.bot) &&
			(filters.minor === null || record.minor === filters.minor) &&
			(filters.namespace === null || record.namespace === filters.namespace) &&
			(filters.searchText === "" ||
				lowerRecordDomain.includes(lowerSearchText) ||
				lowerRecordTitle.includes(lowerSearchText) ||
				lowerRecordType.includes(lowerSearchText) ||
				lowerRecordComment.includes(lowerSearchText))
		);
	});

	return (
		<Box sx={{ padding: 2 }}>
			<FormGroup row sx={{ marginBottom: 3, gap: 2 }}>
				<TextField
					label="Search Anonymous"
					value={filters.searchText}
					onChange={(e) => onFilterChange("searchText", e.target.value)}
					sx={{ flex: 1 }}
					variant="outlined"
				/>
				<FormControl sx={{ flex: 1 }} variant="outlined">
					<InputLabel>Domain</InputLabel>
					<Select value={filters.domain} onChange={(e) => onFilterChange("domain", e.target.value)} label="Domain">
						<MenuItem value="">All</MenuItem>
						{uniqueDomains.map((domain) => (
							<MenuItem key={domain} value={domain}>
								{domain}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<TextField
					label="Title"
					value={filters.title}
					onChange={(e) => onFilterChange("title", e.target.value)}
					sx={{ flex: 1 }}
					variant="outlined"
				/>
				<TextField
					label="User"
					value={filters.user}
					onChange={(e) => onFilterChange("user", e.target.value)}
					sx={{ flex: 1 }}
					variant="outlined"
				/>
				<TextField
					type="number"
					label="Namespace"
					value={filters.namespace !== null ? filters.namespace : ""}
					onChange={(e) => onFilterChange("namespace", e.target.value ? Number(e.target.value) : null)}
					sx={{ flex: 1 }}
					variant="outlined"
				/>
				<FormControlLabel
					control={
						<Checkbox
							checked={filters.bot === true}
							onChange={(e) => onFilterChange("bot", e.target.checked ? true : null)}
						/>
					}
					label="Bot"
				/>
				<FormControlLabel
					control={
						<Checkbox
							checked={filters.minor === true}
							onChange={(e) => onFilterChange("minor", e.target.checked ? true : null)}
						/>
					}
					label="Minor"
				/>
				<FormControlLabel
					control={<Checkbox checked={filters.editsOnly} onChange={(e) => onFilterChange("editsOnly", e.target.checked)} />}
					label="Edits Only"
				/>
				<Button variant="outlined" color="secondary" onClick={onClearFilters}>
					Clear Filters
				</Button>
			</FormGroup>

			<TableContainer
				component={Paper}
				sx={{
					maxWidth: "100%",
					overflow: "auto",
					maxHeight: "calc(100vh - 200px)",
					"&::-webkit-scrollbar": {
						width: "12px",
					},
					"&::-webkit-scrollbar-track": {
						background: "#f5f5f5",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "#888",
						borderRadius: "10px",
					},
					"&::-webkit-scrollbar-thumb:hover": {
						background: "#555",
					},
				}}
			>
				<Table sx={{ minWidth: 600 }}>
					<TableHead>
						<TableRow>
							<TableCell sx={{ width: 120 }}>Domain</TableCell>
							<TableCell sx={{ width: 120 }}>Title</TableCell>
							<TableCell sx={{ width: 80 }}>Type</TableCell>
							<TableCell sx={{ width: 220 }}>Comment</TableCell>
							<TableCell sx={{ width: 120 }}>User</TableCell>
							<TableCell sx={{ width: 80 }}>Bot</TableCell>
							<TableCell sx={{ width: 80 }}>Minor</TableCell>
							<TableCell sx={{ width: 100 }}>Namespace</TableCell>
							<TableCell sx={{ width: 80 }}>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{filteredData.length === 0 ? (
							<TableRow>
								<TableCell colSpan={9} align="center">
									<CircularProgress />
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((record) => (
								<TableRow
									key={record.id}
									sx={{
										backgroundColor: record.seen ? "#ffffff" : "#e3f2fd",
										"&:hover": {
											backgroundColor: record.seen ? "#f0f0f0" : "#d0e6f4",
										},
									}}
								>
									<TableCell>
										<Tooltip title={record.domain} arrow>
											<span>{record.domain}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.title} arrow>
											<span>{record.title}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.type} arrow>
											<span>{record.type}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.comment} arrow>
											<span>{record.comment}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.user} arrow>
											<span>{record.user}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.bot ? "Yes" : "No"} arrow>
											<span>{record.bot ? "Yes" : "No"}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.minor ? "Yes" : "No"} arrow>
											<span>{record.minor ? "Yes" : "No"}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<Tooltip title={record.namespace} arrow>
											<span>{record.namespace}</span>
										</Tooltip>
									</TableCell>
									<TableCell>
										<IconButton color="primary" onClick={() => onMarkSeen(record.id)}>
											<CheckCircleIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};

// COMPONENT
const RealTimeMonitoring = () => {
	const [data, setData] = useState([]);
	const [uniqueDomains, setUniqueDomains] = useState([]);
	const [filters, setFilters] = useState(() => {
		const savedFilters = localStorage.getItem("realTimeFilters");
		return savedFilters
			? JSON.parse(savedFilters)
			: {
					domain: "",
					title: "",
					user: "",
					bot: null,
					minor: null,
					namespace: null,
					searchText: "",
					editsOnly: true,
			  };
	});

	const handleMarkSeen = (id) => {
		setData((prevData) => prevData.map((item) => (item.id === id ? { ...item, seen: true } : item)));
	};

	const handleFilterChange = (field, value) => {
		setFilters((prevFilters) => {
			const newFilters = { ...prevFilters, [field]: value };
			localStorage.setItem("realTimeFilters", JSON.stringify(newFilters));
			return newFilters;
		});
	};

	const clearFilters = () => {
		localStorage.removeItem("realTimeFilters");
		setFilters({
			domain: "",
			title: "",
			user: "",
			bot: null,
			minor: null,
			namespace: null,
			searchText: "",
			editsOnly: true,
		});
	};

	const eventSourceData = useEventSource(RECENT_CHANGE_URI);

	useEffect(() => {
		const storedDomains = localStorage.getItem("uniqueDomains");
		if (storedDomains) {
			setUniqueDomains(JSON.parse(storedDomains));
		}
	}, []);

	useEffect(() => {
		setData((prevData) => {
			const newData = eventSourceData.map((newRecord) => {
				const existingRecord = prevData.find((item) => item.id === newRecord.id);
				return existingRecord ? { ...newRecord, seen: existingRecord.seen } : newRecord;
			});
			return newData;
		});

		const newDomains = eventSourceData.map((record) => record.domain).filter(Boolean);

		setUniqueDomains((prevDomains) => {
			const allDomains = new Set([...prevDomains, ...newDomains]);
			const updatedDomains = Array.from(allDomains);

			newDomains.forEach((domain) => {
				if (!prevDomains.includes(domain)) {
					toast.info(`A new edit in ${domain}`);
				}
			});

			if (updatedDomains.length > 0) {
				localStorage.setItem("uniqueDomains", JSON.stringify(updatedDomains));
			}

			return updatedDomains;
		});
	}, [eventSourceData]);

	return (
		<Box sx={{ padding: 2 }}>
			<Typography variant="h4" gutterBottom align="center">
				Real-Time Monitoring
			</Typography>
			<ToastContainer />
			<RealTimeTable
				data={data}
				onMarkSeen={handleMarkSeen}
				filters={filters}
				onFilterChange={handleFilterChange}
				onClearFilters={clearFilters}
				uniqueDomains={uniqueDomains}
			/>
		</Box>
	);
};

export default RealTimeMonitoring;

// PROP TYPES
RealTimeTable.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			domain: PropTypes.string.isRequired,
			type: PropTypes.string.isRequired,
			title: PropTypes.string.isRequired,
			comment: PropTypes.string.isRequired,
			user: PropTypes.string.isRequired,
			bot: PropTypes.bool.isRequired,
			minor: PropTypes.bool,
			namespace: PropTypes.number,
			seen: PropTypes.bool.isRequired,
		}),
	).isRequired,
	onMarkSeen: PropTypes.func.isRequired,
	filters: PropTypes.shape({
		domain: PropTypes.string,
		title: PropTypes.string,
		user: PropTypes.string,
		bot: PropTypes.bool,
		minor: PropTypes.bool,
		namespace: PropTypes.number,
		searchText: PropTypes.string,
		editsOnly: PropTypes.bool,
	}).isRequired,
	onFilterChange: PropTypes.func.isRequired,
	onClearFilters: PropTypes.func.isRequired,
	uniqueDomains: PropTypes.array.isRequired,
};
