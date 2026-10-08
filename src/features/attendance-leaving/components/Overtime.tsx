// components/Overtime.tsx
// Admin view for overtime requests.
// Backend:
//   GET  /overtime/requests?status=&employee_id=&page=&per_page=  -> getAllOvertimeRequests
//   POST /overtime/{id}/approve                                   -> approveOvertimeRequest
//   POST /overtime/{id}/reject { rejection_reason }               -> rejectOvertimeRequest
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

const API_BASE_URL = "https://api-hris.slarenasitsolutions.com/public/api";

interface Employee {
  id: number;
  employee_id?: string;
  profile_picture?: string | null;
  first_name: string;
  last_name: string;
  email?: string;
}

interface OvertimeRequest {
  id: number;
  employee_id: number;
  overtime_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  reason: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled" | string;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  approver?: Employee | null;
}

interface OvertimeResponse {
  isSuccess: boolean;
  message?: string;
  data: OvertimeRequest[];
  pagination: {
    current_page: number;
    perPage?: number;
    per_page?: number;
    total: number;
    last_page: number;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token") ?? "";
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const Overtime = () => {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const [selectedRequest, setSelectedRequest] =
    useState<OvertimeRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<OvertimeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchOvertimeRequests = async (
    page: number = currentPage,
    limit: number = perPage,
    status: string = statusFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("per_page", String(limit));
      if (status && status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(
        `${API_BASE_URL}/overtime/requests?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (response.status === 401) {
        throw new Error("Unauthenticated. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch overtime requests (${response.status})`);
      }

      const result: OvertimeResponse = await response.json();

      if (result.isSuccess) {
        setRequests(result.data || []);
        setCurrentPage(result.pagination?.current_page ?? page);
        setPerPage(
          result.pagination?.perPage ?? result.pagination?.per_page ?? limit
        );
        setTotal(result.pagination?.total ?? 0);
        setLastPage(result.pagination?.last_page ?? 1);
      } else {
        throw new Error(result.message || "Failed to fetch overtime requests");
      }
    } catch (err: any) {
      console.error("Error fetching overtime requests:", err);
      setError(err?.message || "Failed to fetch overtime requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimeRequests(1, perPage, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchOvertimeRequests(1, perPage, statusFilter);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
    // fetch without stale state
    setTimeout(() => fetchOvertimeRequests(1, perPage, "all"), 0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchOvertimeRequests(1, perPage, value);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > lastPage || page === currentPage) return;
    setCurrentPage(page);
    fetchOvertimeRequests(page, perPage, statusFilter);
  };

  const handlePerPageChange = (value: string) => {
    const limit = parseInt(value, 10);
    setPerPage(limit);
    setCurrentPage(1);
    fetchOvertimeRequests(1, limit, statusFilter);
  };

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/overtime/${id}/approve`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.isSuccess === false) {
        throw new Error(
          result.message || `Failed to approve overtime request (${response.status})`
        );
      }

      // Refresh list to reflect server state
      await fetchOvertimeRequests(currentPage, perPage, statusFilter);
      setIsViewDialogOpen(false);
    } catch (err: any) {
      console.error("Error approving overtime request:", err);
      alert(err?.message || "Failed to approve overtime request.");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (record: OvertimeRequest) => {
    setRejectTarget(record);
    setRejectionReason(record.rejection_reason || "");
    setRejectError(null);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      setRejectError("Rejection reason is required.");
      return;
    }

    setProcessingId(rejectTarget.id);
    setRejectError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/overtime/${rejectTarget.id}/reject`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ rejection_reason: rejectionReason.trim() }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.isSuccess === false) {
        const serverErrors = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : "";
        throw new Error(
          serverErrors ||
            result.message ||
            `Failed to reject overtime request (${response.status})`
        );
      }

      setIsRejectDialogOpen(false);
      setRejectTarget(null);
      setRejectionReason("");
      setIsViewDialogOpen(false);
      await fetchOvertimeRequests(currentPage, perPage, statusFilter);
    } catch (err: any) {
      console.error("Error rejecting overtime request:", err);
      setRejectError(err?.message || "Failed to reject overtime request.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

  const getEmployeeName = (employee?: Employee | null) => {
    if (!employee) return "Unknown";
    return `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Unknown";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "--";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    // Backend stores times as "HH:mm" (validated date_format:H:i)
    return `${start || "--"} - ${end || "--"}`;
  };

  const truncateText = (text: string | null, limit = 40) => {
    if (!text) return "--";
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  };

  // Client-side search (backend has no search param for this endpoint)
  const filteredRequests = requests.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = getEmployeeName(r.employee).toLowerCase();
    const empId = String(r.employee?.employee_id || r.employee_id || "").toLowerCase();
    const reason = (r.reason || "").toLowerCase();
    return (
      name.includes(q) || empId.includes(q) || reason.includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;
  const approvedHours = requests
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);

  const paginationFrom = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const paginationTo = Math.min(currentPage * perPage, total);

  if (loading && requests.length === 0) {
    return (
      <div className="p-6 flex justify-center items-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading overtime requests...</span>
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => fetchOvertimeRequests(1, perPage, statusFilter)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overtime Management</h1>
          <p className="text-muted-foreground">
            Review and approve employee overtime requests
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOvertimeRequests(currentPage, perPage, statusFilter)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Approved requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {approvedHours.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total approved OT hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Search Employees</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, ID, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-2 block">Filter by Status</label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                disabled={!searchTerm && (statusFilter === "all" || !statusFilter)}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Overtime Requests</CardTitle>
              <CardDescription>
                Review and approve overtime requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Label className="text-xs">Rows</Label>
              <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Overtime Requests Found
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm || (statusFilter && statusFilter !== "all")
                  ? "No overtime requests match your current filters. Try adjusting your search criteria."
                  : "There are no overtime requests at this time."}
              </p>
              {(searchTerm || (statusFilter && statusFilter !== "all")) && (
                <Button variant="outline" onClick={handleClearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {paginationFrom}&ndash;{paginationTo} of {total} overtime requests
                {searchTerm && ` (filtered to ${filteredRequests.length} on this page)`}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>OT Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            {record.employee?.profile_picture ? (
                              <AvatarImage
                                src={record.employee.profile_picture}
                                alt={getEmployeeName(record.employee)}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <AvatarFallback>
                                {getInitials(
                                  record.employee?.first_name,
                                  record.employee?.last_name
                                )}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {getEmployeeName(record.employee)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.employee?.email ||
                                record.employee?.employee_id ||
                                `ID: ${record.employee_id}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(record.overtime_date)}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatTimeRange(record.start_time, record.end_time)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(record.total_hours).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {record.reason ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-pointer">
                                    {truncateText(record.reason)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {record.reason}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(record.status)}>
                            {record.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(record);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {record.status === "Pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(record.id)}
                                  disabled={processingId === record.id}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  {processingId === record.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRejectDialog(record)}
                                  disabled={processingId === record.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {record.status !== "Pending" && (
                              <span className="text-sm text-muted-foreground italic self-center">
                                Processed
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {paginationFrom}&ndash;{paginationTo} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= lastPage || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Overtime Request Details</DialogTitle>
            <DialogDescription>
              Complete information for this overtime request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(
                      selectedRequest.employee?.first_name,
                      selectedRequest.employee?.last_name
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {getEmployeeName(selectedRequest.employee)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.employee?.email || `ID: ${selectedRequest.employee_id}`}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>OT Date</Label>
                  <p className="text-sm">{formatDate(selectedRequest.overtime_date)}</p>
                </div>
                <div>
                  <Label>Total Hours</Label>
                  <p className="text-sm font-medium">
                    {Number(selectedRequest.total_hours).toFixed(2)} hr(s)
                  </p>
                </div>
                <div>
                  <Label>Start Time</Label>
                  <p className="text-sm">{selectedRequest.start_time}</p>
                </div>
                <div>
                  <Label>End Time</Label>
                  <p className="text-sm">{selectedRequest.end_time}</p>
                </div>
                <div>
                  <Label>Filed</Label>
                  <p className="text-sm">{formatDate(selectedRequest.created_at)}</p>
                </div>
                <div>
                  <Label>Approver</Label>
                  <p className="text-sm">
                    {selectedRequest.approver
                      ? getEmployeeName(selectedRequest.approver)
                      : "--"}
                  </p>
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {selectedRequest.reason || "--"}
                </p>
              </div>
              {selectedRequest.rejection_reason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <p className="text-sm mt-1 p-3 bg-red-50 text-red-800 rounded-md">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}
              {selectedRequest.status === "Pending" && (
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="flex-1"
                    disabled={processingId === selectedRequest.id}
                  >
                    {processingId === selectedRequest.id ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      openRejectDialog(selectedRequest);
                    }}
                    className="flex-1"
                    disabled={processingId === selectedRequest.id}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `Reject OT request of ${getEmployeeName(rejectTarget.employee)} on ${formatDate(rejectTarget.overtime_date)}. A reason is required.`
                : "Provide a rejection reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection_reason">Rejection Reason *</Label>
            <Textarea
              id="rejection_reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            {rejectError && <p className="text-sm text-red-500">{rejectError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processingId === rejectTarget?.id}
            >
              {processingId === rejectTarget?.id ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Overtime;
