import { useState, useMemo, useCallback } from 'react';
import { ButtonsRadio } from "../components/ButtonsRadio"
import { DatabaseForm } from "../components/popup/DatabaseForm";
import { Table } from "../components/table/Table"
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import type { OnDataChange } from './Application';
import type { CollectionName, DataChange } from '../services/api';

const ALL_BUTTONS = ["users", "client", "center", "service", "costs"];
const NO_FILTERS = { center: [], client: [], worker: [], service: [] };
const NO_COLUMN_FILTERS: string[] = [];

export function Setup({ data, onDataChange, user } : { data: any, onDataChange: OnDataChange, user: any }) {
    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);

    const [idButtons, setIdButtons] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter buttons based on user permissions
    const isAdmin = user?.isAdmin === true;
    const buttonsName: string[] = useMemo(
        () => isAdmin ? ALL_BUTTONS : ALL_BUTTONS.filter(button => button !== "users"),
        [isAdmin]
    );
    const currentColumn = buttonsName[idButtons] as CollectionName;

    // Called when a form closes. `change` is only set when something was saved/deleted,
    // so cancelling a form no longer reloads anything.
    const handleClose = useCallback((change?: DataChange) => {
        setShow(false)
        if (change) onDataChange(currentColumn, change);
    }, [onDataChange, currentColumn])

    // Filter data based on search term for users table
    const filteredData = useMemo(() => {
        if (buttonsName[idButtons] !== "users" || !searchTerm) {
            return data;
        }

        const filtered = { ...data };
        if (data.users) {
            filtered.users = data.users.filter((user: any) => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.firstName?.toLowerCase().includes(searchLower) ||
                    user.lastName?.toLowerCase().includes(searchLower) ||
                    (user.isAdmin ? "administrator" : "regular user").includes(searchLower)
                );
            });
        }
        return filtered;
    }, [data, searchTerm, idButtons, buttonsName]);

    return <>
    <div className='p-5' style={{height: "100vh", overflow:"auto"}}>
        <div style={{ display: "flex", alignItems: "center" }}>
            <ButtonsRadio buttonsName={buttonsName} onChangeFunction={setIdButtons} selectedButton={idButtons}/>
            {/* Hide add button for users table if not admin, or show for all other tables */}
            {(isAdmin || buttonsName[idButtons] !== "users") && (
                <Button className='m-2'style={{ borderRadius: "25px", backgroundColor: "#F2F2F2", color:"#706762", borderColor: 'transparent', height: "33px", width: "33px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={handleShow}>
                    +
                </Button>
            )}
        </div>

        {/* Search input for users table */}
        {buttonsName[idButtons] === "users" && (
            <div style={{ margin: "15px 0" }}>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        width: "300px",
                        fontSize: "14px"
                    }}
                />
            </div>
        )}

        <Modal show={show} onHide={() => handleClose()}>
            <Modal.Header closeButton>
                <Modal.Title>Add {buttonsName[idButtons]}</Modal.Title>
            </Modal.Header>
            <DatabaseForm columnName={buttonsName[idButtons]} data={data} defaultValue={null} closePopupFunc={handleClose} user={user}/>
        </Modal>
        <Table column={buttonsName[idButtons]} data={filteredData} resetDataFunc={handleClose} user={user} filters={NO_FILTERS} columnFilters={NO_COLUMN_FILTERS} deleteFunction={null} toggleAllLines={null} deleteLines={null}/>
    </div>
    </>
}