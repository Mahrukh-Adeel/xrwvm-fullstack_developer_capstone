import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import "./Dealers.css";
import "../assets/style.css";
import positive_icon from "../assets/positive.png"
import neutral_icon from "../assets/neutral.png"
import negative_icon from "../assets/negative.png"
import review_icon from "../assets/reviewbutton.png"
import Header from '../Header/Header';

const Dealer = () => {
  const [dealer, setDealer] = useState({});
  const [reviews, setReviews] = useState([]);
  const [unreviewed, setUnreviewed] = useState(false);
  const [postReview, setPostReview] = useState(<></>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  let curr_url = window.location.href;
  let root_url = curr_url.substring(0, curr_url.indexOf("dealer"));
  let params = useParams();
  let id = params.id;
  let dealer_url = root_url + `djangoapp/dealer/${id}`;
  let reviews_url = root_url + `djangoapp/reviews/dealer/${id}`;
  let post_review = root_url + `postreview/${id}`;
  
  const get_dealer = async () => {
    try {
      const res = await fetch(dealer_url, {
        method: "GET"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const retobj = await res.json();
      
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
        throw new Error(retobj.message || 'Failed to fetch dealer details');
      }
    } catch (err) {
      console.error('Error fetching dealer:', err);
      setError('Failed to load dealer details. Please try again.');
    }
  };

  const get_reviews = async () => {
    try {
      const res = await fetch(reviews_url, {
        method: "GET"
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const retobj = await res.json();
      
      if (retobj.status === 200) {
        const reviewsData = retobj.reviews || [];
        if (reviewsData.length > 0) {
          setReviews(reviewsData);
        } else {
          setUnreviewed(true);
        }
      } else {
        throw new Error(retobj.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    }
  };

  const senti_icon = (sentiment) => {
    let icon = sentiment === "positive" ? positive_icon : 
               sentiment === "negative" ? negative_icon : neutral_icon;
    return icon;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([get_dealer(), get_reviews()]);
      
      if (sessionStorage.getItem("username")) {
        setPostReview(
          <a href={post_review}>
            <img 
              src={review_icon} 
              style={{width:'10%', marginLeft:'10px', marginTop:'10px'}} 
              alt='Post Review'
            />
          </a>
        );
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [id]); // Add id as dependency

  if (loading) {
    return (
      <div style={{margin:"20px"}}>
        <Header/>
        <div style={{marginTop:"10px"}}>
          <p>Loading dealer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{margin:"20px"}}>
        <Header/>
        <div style={{marginTop:"10px"}}>
          <p style={{color: 'red'}}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{margin:"20px"}}>
      <Header/>
      <div style={{marginTop:"10px"}}>
        <h1 style={{color:"grey"}}>
          {dealer.full_name || 'Unknown Dealer'}{postReview}
        </h1>
        <h4 style={{color:"grey"}}>
          {dealer.city || 'N/A'}, {dealer.address || 'N/A'}, 
          Zip - {dealer.zip || 'N/A'}, {dealer.state || 'N/A'}
        </h4>
      </div>
      <div className="reviews_panel">
        {reviews.length === 0 && unreviewed === false ? (
          <div>Loading Reviews....</div>
        ) : unreviewed === true ? (
          <div>No reviews yet!</div>
        ) : (
          reviews.map((review, index) => (
            <div key={index} className='review_panel'>
              <img 
                src={senti_icon(review.sentiment)} 
                className="emotion_icon" 
                alt='Sentiment'
              />
              <div className='review'>{review.review}</div>
              <div className="reviewer">
                {review.name} {review.car_make} {review.car_model} {review.car_year}
              </div>
            </div>
          ))
        )}
      </div>  
    </div>
  );
};

export default Dealer;