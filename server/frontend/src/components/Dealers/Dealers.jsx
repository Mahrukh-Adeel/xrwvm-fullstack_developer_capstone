import React, { useState, useEffect } from 'react';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';
import review_icon from "../assets/reviewicon.png"

const Dealers = () => {
    const [dealersList, setDealersList] = useState([]);
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    let dealer_url = "/djangoapp/get_dealers/";
    let dealer_url_by_state = "/djangoapp/get_dealers/";

    const filterDealers = async (state) => {
        try {
            setLoading(true);
            setError(null);
            
            if (state === "All") {
                // If "All States" is selected, get all dealers
                await get_dealers();
                return;
            }
            
            const url = dealer_url_by_state + state;
            const res = await fetch(url, {
                method: "GET"
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const retobj = await res.json();
            
            if (retobj.status === 200) {
                // Check if dealers exists and is iterable
                const dealers = retobj.dealers || [];
                const state_dealers = Array.isArray(dealers) ? dealers : Array.from(dealers);
                setDealersList(state_dealers);
            } else {
                throw new Error(retobj.message || 'Failed to fetch dealers by state');
            }
        } catch (err) {
            console.error('Error filtering dealers:', err);
            setError('Failed to filter dealers. Please try again.');
            setDealersList([]);
        } finally {
            setLoading(false);
        }
    };

    const get_dealers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await fetch(dealer_url, {
                method: "GET"
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const retobj = await res.json();
            
            if (retobj.status === 200) {
                // Check if dealers exists and is iterable
                const dealers = retobj.dealers || [];
                const all_dealers = Array.isArray(dealers) ? dealers : Array.from(dealers);
                
                // Extract unique states
                const statesSet = new Set();
                all_dealers.forEach((dealer) => {
                    if (dealer && dealer.state) {
                        statesSet.add(dealer.state);
                    }
                });
                
                setStates(Array.from(statesSet));
                setDealersList(all_dealers);
            } else {
                throw new Error(retobj.message || 'Failed to fetch dealers');
            }
        } catch (err) {
            console.error('Error fetching dealers:', err);
            setError('Failed to load dealers. Please try again.');
            setDealersList([]);
            setStates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        get_dealers();
    }, []);

    let isLoggedIn = sessionStorage.getItem("username") != null ? true : false;

    if (loading) {
        return (
            <div>
                <Header/>
                <div className="loading">Loading dealers...</div>
            </div>
        );
    }

    return (
        <div>
            <Header/>
            {error && (
                <div className="error-message" style={{color: 'red', padding: '10px', textAlign: 'center'}}>
                    {error}
                </div>
            )}
            <table className='table'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Dealer Name</th>
                        <th>City</th>
                        <th>Address</th>
                        <th>Zip</th>
                        <th>
                            <select 
                                name="state" 
                                id="state" 
                                onChange={(e) => filterDealers(e.target.value)}
                                disabled={loading}
                            >
                                <option value="" disabled hidden>State</option>
                                <option value="All">All States</option>
                                {states.map((state, index) => (
                                    <option key={index} value={state}>{state}</option>
                                ))}
                            </select>
                        </th>
                        {isLoggedIn && <th>Review Dealer</th>}
                    </tr>
                </thead>
                <tbody>
                    {dealersList.length === 0 && !loading ? (
                        <tr>
                            <td colSpan={isLoggedIn ? "7" : "6"} style={{textAlign: 'center'}}>
                                No dealers found
                            </td>
                        </tr>
                    ) : (
                        dealersList.map((dealer, index) => (
                            <tr key={dealer.id || index}>
                                <td>{dealer.id || 'N/A'}</td>
                                <td>
                                    <a href={'/dealer/' + dealer.id}>
                                        {dealer.full_name || 'N/A'}
                                    </a>
                                </td>
                                <td>{dealer.city || 'N/A'}</td>
                                <td>{dealer.address || 'N/A'}</td>
                                <td>{dealer.zip || 'N/A'}</td>
                                <td>{dealer.state || 'N/A'}</td>
                                {isLoggedIn && (
                                    <td>
                                        <a href={`/postreview/${dealer.id}`}>
                                            <img 
                                                src={review_icon} 
                                                className="review_icon" 
                                                alt="Post Review"
                                            />
                                        </a>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Dealers;