// Global reference to the current user's document
var currentUser;

//------------------------------------------------------------------------
//--------------Retrieves previous upload from Firestore database---------
//------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', (event) => {
    // Attempt to retrieve user ID and document timestamp from localStorage from the previous page share.html to populate the form fields
    // these are set to localStorage in share.js
    const userId = localStorage.getItem('userId');
    const documentTimestamp = localStorage.getItem('documentTimestamp');
    // log timestamp, uncomment for debugging
    // console.log("Timestamp:", documentTimestamp);

    // Check if the user ID and document timestamp exist in localStorage
    if (userId && documentTimestamp) {
        // Reference to the specific document in the user_uploads collection based on the document timestamp
        currentUser = db.collection("users").doc(userId);
        currentUser.collection("user_uploads").doc(documentTimestamp).get()
            .then((doc) => {
                // check if the document exists
                if (doc.exists) {
                    const data = doc.data(); // Retrieve the document data
                    // log data, uncomment for debugging
                    // console.log("Retrieved data:", data);

                    // Populate the form fields with the data from the previous share.html page by calling it from firestore
                    document.getElementById('productBox').value = data.product || '';
                    document.getElementById('priceBox').value = data.price || '';
                    document.getElementById('amountBox').value = data.amount || '';
                    document.getElementById('varietyBox').value = data.variety || '';
                    document.getElementById('pluBox').value = data.plu || '';
                    document.getElementById('storeNameBox').value = data.storeName || '';
                    document.getElementById('addressBox').value = data.address || '';

                    //If a photo URL is available, set it as the source for the photo preview
                    if (data.photo) {
                        document.getElementById('photoPreview').src = data.photo;
                    }
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            })
            .catch((error) => {
                // log error to console
                console.error("Error getting document:", error);
            });
    }

    // Set event listeners for the buttons and file input
    document.getElementById('photoBox').addEventListener('change', handleFileSelect, false); // For file input - to handle file selection for photo upload
    document.getElementById('editBtn').addEventListener('click', editShareInfo); // For edit button - to enable editing of the form fields
    document.getElementById('saveBtn').addEventListener('click', saveShareInfo); // For save button - to save the updated information to Firestore
});

//-------------------------------------------------------------------------
//----Handles uploading a new photo, and using the reference as a display--
//-------------------------------------------------------------------------
function handleFileSelect(event) {
    const reader = new FileReader();

    // Event handler for file reader load event
    reader.onload = function (e) {
        // Update the photo preview from the previous share.html page
        document.getElementById('photoPreview').src = e.target.result;
    };

    // Read the selected file as a data URL <- points to the firebase storage 
    reader.readAsDataURL(event.target.files[0]);
}

//---------------------------------------------------------------------------------------
//-----------Enables the save button and fields on share_review.html to be edited--------
//---------------------------------------------------------------------------------------
function editShareInfo() {
    // log to console to make sure the function is being called
    console.log("Inside editShareInfo");
    // Enable all form fields and the save button
    var formElements = document.getElementById('reviewPriceForm').elements;
    //  iterate through the form elements and enable them
    for (var i = 0, len = formElements.length; i < len; ++i) {
        formElements[i].disabled = false;
    }
    // Enable the save button
    var saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = false

    // Attach the event listener to the save button
    saveBtn.addEventListener('click', saveShareInfo);
}

//--------------------------------------------------------------------------
//-----Edits the previous upload and updates the Firestore database---------
//--------------------------------------------------------------------------
function saveShareInfo() {
    // Retrieve values from the form fields and update the Firestore document with any changes
    var productValue = document.getElementById('productBox').value;
    var priceValue = document.getElementById('priceBox').value;
    var amountValue = document.getElementById('amountBox').value;
    var varietyValue = document.getElementById('varietyBox').value;
    var pluValue = document.getElementById('pluBox').value;
    var storeNameValue = document.getElementById('storeNameBox').value;
    var addressValue = document.getElementById('addressBox').value;
    const photoFile = document.getElementById('photoBox').files[0];

    // Retrieve user ID and document timestamp from localStorage to make sure the previously shared document is updated
    const userId = localStorage.getItem('userId');
    const documentTimestamp = localStorage.getItem('documentTimestamp');

    // Check if a new photo was selected for upload
    if (photoFile) {
        // Upload the new photo to Firebase Storage first
        firebase.storage().ref(`photos/${userId}/${documentTimestamp}`).put(photoFile)
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(photoURL => {
                // Update firestore with the new photo URL and other form data
                return currentUser.collection("user_uploads").doc(documentTimestamp).update({
                    product: productValue,
                    price: priceValue,
                    amount: amountValue,
                    variety: varietyValue,
                    plu: pluValue,
                    storeName: storeNameValue,
                    address: addressValue,
                    photo: photoURL, // Store the new photo URL
                    last_updated: firebase.firestore.FieldValue.serverTimestamp(),
                });
            })
            .then(() => {
                console.log("Document successfully updated with new photo!");
                // display success message on successful update
                Swal.fire({
                    title: "Edit Successful",
                    text: "Your upload has been updated with a new photo!",
                    icon: "success"
                });
            })
            .catch(error => {
                // log error to console
                console.error("Error updating document with new photo: ", error);
            });
    } else {
        // If no new photo is selected, update other form data only
        currentUser.collection("user_uploads").doc(documentTimestamp).update({
            product: productValue,
            price: priceValue,
            amount: amountValue,
            variety: varietyValue,
            plu: pluValue,
            storeName: storeNameValue,
            address: addressValue,
            last_updated: firebase.firestore.FieldValue.serverTimestamp(),
        })
            .then(() => {
                // log success to console
                console.log("Document successfully updated!");
                // display success message
                Swal.fire({
                    title: "Edit Successful",
                    text: "Your upload has been updated!",
                    icon: "success"
                });
            })
            .catch(error => {
                // log error to console
                console.error("Error updating document: ", error);
            });
    }
}
