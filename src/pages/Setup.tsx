import { useState } from 'react';
import { ButtonsRadio } from "../components/ButtonsRadio"
import { DatabaseForm } from "../components/popup/DatabaseForm";
import { Table } from "../components/table/Table"
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export function Setup({ data, reloadData, user } : { data: any, reloadData: any, user: any }) {
    const [show, setShow] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    
    const handleShow = () => setShow(true);
    const handleClose = () => {
        reloadData();
        setShow(false)
    }

    const handleClosePermissions = () => {
        setShowPermissions(false);
        setSelectedUser(null);
        setIsSavingPermissions(false);
        reloadData();
    }

    const handleSavePermissions = async () => {
        if (!selectedUser) return;

        // Show confirmation for significant changes
        const hasRoleChange = selectedUser.role !== (data.users?.find((u: any) => u._id === selectedUser._id)?.role || 'viewer');
        const hasAccessRemoval = (selectedUser.assignedCenters?.length || 0) === 0 || (selectedUser.assignedServices?.length || 0) === 0;
        
        if (hasRoleChange || hasAccessRemoval) {
            const confirmMessage = hasRoleChange && hasAccessRemoval 
                ? `Are you sure you want to change the role to "${selectedUser.role}" AND remove all center/service access? This will severely limit the user's capabilities.`
                : hasRoleChange 
                ? `Are you sure you want to change the role to "${selectedUser.role}"?`
                : 'Are you sure you want to remove all center/service access? This will limit the user\'s data visibility.';
            
            if (!confirm(confirmMessage)) {
                return;
            }
        }

        setIsSavingPermissions(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://gogain-backend.onrender.com/';
            
            const response = await fetch(`${apiUrl}users/${selectedUser._id}/permissions`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    role: selectedUser.role,
                    assignedCenters: selectedUser.assignedCenters || [],
                    assignedServices: selectedUser.assignedServices || [],
                    permissions: selectedUser.permissions || {}
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update permissions');
            }

            const result = await response.json();
            console.log('Permissions updated successfully:', result);
            
            // Show success message (you can add a toast notification here)
            alert('User permissions updated successfully!');
            
            // Close modal and reload data
            handleClosePermissions();
        } catch (error) {
            console.error('Error updating permissions:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error updating permissions: ${errorMessage}`);
        } finally {
            setIsSavingPermissions(false);
        }
    }

    const [idButtons, setIdButtons] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const buttonsName: string[] = user.isAdmin ? [
        "users",
        "client",
        "center",
        "service",
        "costs"
    ] : [
        "client",
    ];

    // Filter logic for the selected entity
    const selectedEntity = buttonsName[idButtons];
    const entityData = data[selectedEntity] || [];
    const filteredData = searchQuery.trim() === "" ? entityData : entityData.filter((item: any) => {
        // Check all string/number fields for a match
        return Object.values(item).some((value) => {
            if (typeof value === 'string' || typeof value === 'number') {
                return value.toString().toLowerCase().includes(searchQuery.toLowerCase());
            }
            // For arrays (like centers/services), join and search
            if (Array.isArray(value)) {
                return value.join(", ").toLowerCase().includes(searchQuery.toLowerCase());
            }
            return false;
        });
    });
    // Compose filtered data object for Table
    const filteredDataObj = { ...data, [selectedEntity]: filteredData };

    // Available roles for permission management
    const availableRoles = ['super_admin', 'admin', 'manager', 'worker', 'viewer'];
    
    // Available permissions for each module
    const availablePermissions = {
        users: ['create', 'view', 'edit', 'delete'],
        clients: ['create', 'view', 'edit', 'delete'],
        centers: ['create', 'view', 'edit', 'delete'],
        services: ['create', 'view', 'edit', 'delete'],
        costs: ['create', 'view', 'edit', 'delete'],
        transactions: ['create', 'view', 'edit', 'delete']
    };

    return <>
    <div className='p-5' style={{height: "100vh", overflow:"auto"}}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <ButtonsRadio buttonsName={buttonsName} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            <Button className='m-2'style={{ borderRadius: "25px", backgroundColor: "#F2F2F2", color:"#706762", borderColor: 'transparent', height: "33px", width: "33px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleShow}>
                +
            </Button>
            {/* Add Permissions button for users section */}
            {selectedEntity === "users" && user.isAdmin && (
                <Button 
                    className='m-2' 
                    style={{ 
                        borderRadius: "25px", 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        borderColor: 'transparent', 
                        height: "33px", 
                        padding: "0 15px",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                    }} 
                    onClick={() => setShowPermissions(true)}
                >
                    Permissions
                </Button>
            )}
        </div>
        {/* Search Bar */}
        <div className="flex items-center mt-4 mb-2">
            <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedEntity}...`}
                aria-label={`Search ${selectedEntity}`}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-base"
            />
        </div>
        
        {/* Add Permissions button for users section */}
        {selectedEntity === "users" && user.isAdmin && (
            <div className="mb-4">
                <Button 
                    variant="outline-primary" 
                    onClick={() => setShowPermissions(true)}
                    className="mb-3"
                >
                    Manage User Permissions
                </Button>
            </div>
        )}
        
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add {buttonsName[idButtons]}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={buttonsName[idButtons]} data={data} defaultValue={null} closePopupFunc={handleClose} user={user}/>
        </Modal>

        {/* Permissions Management Modal */}
        <Modal show={showPermissions} onHide={handleClosePermissions} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>User Permissions Management</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {selectedUser ? (
                    <div>
                        <h5>User: {selectedUser.email}</h5>
                        <p>Current Role: <strong>{selectedUser.role || 'viewer'}</strong></p>
                        
                        {/* Role Selection */}
                        <div className="mb-4">
                            <label className="form-label">Role:</label>
                            <select 
                                className="form-select"
                                value={selectedUser.role || 'viewer'}
                                onChange={(e) => setSelectedUser({
                                    ...selectedUser,
                                    role: e.target.value
                                })}
                            >
                                {availableRoles.map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned Centers */}
                        <div className="mb-4">
                            <label className="form-label">Assigned Centers:</label>
                            <div className="d-flex flex-wrap gap-2">
                                {data.center?.map((center: any) => (
                                    <div key={center._id} className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`center-${center._id}`}
                                            checked={selectedUser.assignedCenters?.includes(center.name) || false}
                                            onChange={(e) => {
                                                const centers = selectedUser.assignedCenters || [];
                                                if (e.target.checked) {
                                                    setSelectedUser({
                                                        ...selectedUser,
                                                        assignedCenters: [...centers, center.name]
                                                    });
                                                } else {
                                                    setSelectedUser({
                                                        ...selectedUser,
                                                        assignedCenters: centers.filter((c: string) => c !== center.name)
                                                    });
                                                }
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor={`center-${center._id}`}>
                                            {center.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assigned Services */}
                        <div className="mb-4">
                            <label className="form-label">Assigned Services:</label>
                            <div className="d-flex flex-wrap gap-2">
                                {data.service?.map((service: any) => (
                                    <div key={service._id} className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`service-${service._id}`}
                                            checked={selectedUser.assignedServices?.includes(service.name) || false}
                                            onChange={(e) => {
                                                const services = selectedUser.assignedServices || [];
                                                if (e.target.checked) {
                                                    setSelectedUser({
                                                        ...selectedUser,
                                                        assignedServices: [...services, service.name]
                                                    });
                                                } else {
                                                    setSelectedUser({
                                                        ...selectedUser,
                                                        assignedServices: services.filter((s: string) => s !== service.name)
                                                    });
                                                }
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor={`service-${service._id}`}>
                                            {service.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Permissions */}
                        <div className="mb-4">
                            <label className="form-label">Custom Permissions (override role defaults):</label>
                            {Object.entries(availablePermissions).map(([module, actions]) => (
                                <div key={module} className="mb-3">
                                    <h6 className="text-capitalize">{module}:</h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        {actions.map(action => (
                                            <div key={action} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`${module}-${action}`}
                                                    checked={selectedUser.permissions?.[module]?.[action] || false}
                                                    onChange={(e) => {
                                                        const permissions = selectedUser.permissions || {};
                                                        if (!permissions[module]) permissions[module] = {};
                                                        permissions[module][action] = e.target.checked;
                                                        setSelectedUser({
                                                            ...selectedUser,
                                                            permissions
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor={`${module}-${action}`}>
                                                    {action.charAt(0).toUpperCase() + action.slice(1)}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p>Select a user to manage their permissions:</p>
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Centers</th>
                                        <th>Services</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.users?.map((userItem: any) => (
                                        <tr key={userItem._id} className={userItem.email === user.email ? 'table-primary' : ''}>
                                            <td>
                                                {userItem.email}
                                                {userItem.email === user.email && (
                                                    <span className="badge bg-info ms-2">Current User</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge bg-${
                                                    userItem.role === 'super_admin' ? 'danger' :
                                                    userItem.role === 'admin' ? 'warning' :
                                                    userItem.role === 'manager' ? 'info' :
                                                    userItem.role === 'worker' ? 'success' : 'secondary'
                                                }`}>
                                                    {userItem.role ? userItem.role.replace('_', ' ').toUpperCase() : 'VIEWER'}
                                                </span>
                                            </td>
                                            <td>{userItem.assignedCenters?.join(', ') || 'None'}</td>
                                            <td>{userItem.assignedServices?.join(', ') || 'None'}</td>
                                            <td>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    onClick={() => setSelectedUser(userItem)}
                                                    disabled={userItem.email === user.email && user.role !== 'super_admin'}
                                                >
                                                    Edit Permissions
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                {selectedUser && (
                    <>
                        <Button variant="secondary" onClick={handleClosePermissions}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={handleSavePermissions}
                            disabled={isSavingPermissions}
                        >
                            {isSavingPermissions ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                )}
                {!selectedUser && (
                    <Button variant="secondary" onClick={handleClosePermissions}>
                        Close
                    </Button>
                )}
            </Modal.Footer>
        </Modal>

        <Table column={buttonsName[idButtons]} data={filteredDataObj} resetDataFunc={handleClose} user={user} filters={{center: [], client: [], worker: [], service: []}} columnFilters={[]} deleteFunction={null} toggleAllLines={null} deleteLines={null}/>
    </div>
    </>
}