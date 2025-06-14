import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import Header from '../Header/Header';

const PostReview = () => {
    const [dealer, setDealer] = useState({});
    const [review, setReview] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [date, setDate] = useState("");
    const [carmodels, setCarmodels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    let curr_url = window.location.href;
    let root_url = curr_url.substring(0, curr_url.indexOf("postreview"));
    let params = useParams();
    let id = params.id;
    let dealer_url = root_url + `djangoapp/dealer/${id}`;
    let review_url = root_url + `djangoapp/add_review`;
    let carmodels_url = root_url + `djangoapp/get_cars`;

    const postreview = async () => {
        setLoading(true);
        setError(null);

        try {
            let name = sessionStorage.getItem("firstname") + " " + sessionStorage.getItem("lastname");
            // If the first and second name are stored as null, use the username
            if (name.includes("null")) {
                name = sessionStorage.getItem("username");
            }

            // Validation
            if (!model || review === "" || date === "" || year === "" || model === "") {
                alert("All details are mandatory");
                setLoading(false);
                return;
            }

            let model_split = model.split(" ");
            if (model_split.length < 2) {
                alert("Please select a valid car make and model");
                setLoading(false);
                return;
            }

            let make_chosen = model_split[0];
            let model_chosen = model_split[1];

            let jsoninput = JSON.stringify({
                "name": name,
                "dealership": id,
                "review": review,
                "purchase": true,
                "purchase_date": date,
                "car_make": make_chosen,
                "car_model": model_chosen,
                "car_year": year,
            });

            console.log("Posting review:", jsoninput);

            const res = await fetch(review_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: jsoninput,
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const json = await res.json();
            console.log("Server response:", json);

            if (json.status === 200) {
                alert("Review posted successfully!");
                window.location.href = window.location.origin + "/dealer/" + id;
            } else {
                throw new Error(json.message || "Failed to post review");
            }
        } catch (err) {
            console.error('Error posting review:', err);
            setError(err.message || 'Failed to post review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const get_dealer = async () => {
        try {
            const res = await fetch(dealer_url, {
                method: "GET"
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const retobj = await res.json();
            console.log("Dealer response:", retobj);

            if (retobj.status === 200) {
                // Handle both object and array responses
                let dealerData;
                if (Array.isArray(retobj.dealer)) {
                    dealerData = retobj.dealer[0];
                } else {
                    dealerData = retobj.dealer;
                }
                setDealer(dealerData || {});
            } else {
                throw new Error(retobj.message || 'Failed to fetch dealer');
            }
        } catch (err) {
            console.error('Error fetching dealer:', err);
            setError('Failed to load dealer details');
        }
    };

    const get_cars = async () => {
        try {
            const res = await fetch(carmodels_url, {
                method: "GET"
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const retobj = await res.json();
            console.log("Car models response:", retobj);

            if (retobj.CarModels) {
                setCarmodels(retobj.CarModels);
            } else {
                console.warn("No car models found in response");
                setCarmodels([]);
            }
        } catch (err) {
            console.error('Error fetching car models:', err);
            setError('Failed to load car models');
        }
    };

    useEffect(() => {
        get_dealer();
        get_cars();
    }, [id]);

    return (
        <div>
            <Header />
            <div style={{ margin: "5%" }}>
                <h1 style={{ color: "darkblue" }}>
                    {dealer.full_name || 'Loading...'}
                </h1>
                
                {error && (
                    <div style={{ color: 'red', marginBottom: '10px' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="review">Review:</label>
                    <textarea 
                        id='review' 
                        cols='50' 
                        rows='7' 
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your review here..."
                    />
                </div>

                <div className='input_field'>
                    <label>Purchase Date:</label>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    />
                </div>

                <div className='input_field'>
                    <label>Car Make and Model:</label>
                    <select 
                        name="cars" 
                        id="cars" 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                    >
                        <option value="" disabled>Choose Car Make and Model</option>
                        {carmodels.map((carmodel, index) => (
                            <option 
                                key={index} 
                                value={carmodel.CarMake + " " + carmodel.CarModel}
                            >
                                {carmodel.CarMake} {carmodel.CarModel}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='input_field'>
                    <label>Car Year:</label>
                    <input 
                        type="number" 
                        value={year}
                        onChange={(e) => setYear(e.target.value)} 
                        max={2023} 
                        min={2015}
                        placeholder="e.g., 2020"
                    />
                </div>

                <div>
                    <button 
                        className='postreview' 
                        onClick={postreview}
                        disabled={loading}
                        style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Posting...' : 'Post Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostReview;