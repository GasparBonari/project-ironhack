const cartItems = [];

function addToCart(name, price) {
  // Add item to the cart
  cartItems.push({ name, price });

  // Update the cart list
  updateCartList();
}

function updateCartList() {
  const cartList = document.getElementById('cart-list');
  cartList.innerHTML = ''; // Clear the existing list

  // Loop through cart items and append them to the list
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];

    const listItem = document.createElement('li');

    // Display item details
    listItem.textContent = `${item.name} - $${item.price}`;

    // Add a delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function() {
      removeFromCart(i);
    };

    // Append item details and delete button to the list item
    listItem.appendChild(deleteButton);

    // Append the list item to the cart list
    cartList.appendChild(listItem);
  }

  // Update the total amount
  updateTotalAmount();
}

function updateTotalAmount() {
  const totalAmountElement = document.getElementById('totalAmount');
  const totalAmount = cartItems.reduce((total, item) => total + item.price, 0).toFixed(2);
  totalAmountElement.textContent = totalAmount;
}

function checkout() {
  alert("Check out");
}

function removeFromCart(index) {
  // Remove item from the cart based on the index
  cartItems.splice(index, 1);

  // Update the cart list
  updateCartList();
}
