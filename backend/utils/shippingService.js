const logger = require("../config/logger");

let shiprocketToken = null;

/**
 * Authenticates with Shiprocket API using credentials from env
 */
const authenticateShiprocket = async () => {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password || email.includes("your_email") || password.includes("your_password")) {
    logger.warn("Shiprocket credentials are not configured or contain default values. Using simulation fallback.");
    return null;
  }

  try {
    const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    shiprocketToken = data.token;
    return shiprocketToken;
  } catch (error) {
    logger.error(`Shiprocket Authentication failed: ${error.message}`);
    return null;
  }
};

/**
 * Creates a shipping order on Shiprocket and assigns AWB (tracking ID)
 * If API credentials are missing, falls back to a sandbox simulation.
 */
const createShippingOrder = async (paymentRecord, userRecord) => {
  // Try to authenticate
  const token = await authenticateShiprocket();

  // If credentials are not set or authentication failed, return simulated data
  if (!token) {
    logger.info(`Simulating shipment order creation for payment ID: ${paymentRecord._id}`);
    const mockTrackingId = `SR${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    return {
      shipmentId: `mock-ship-${Date.now()}`,
      courierPartner: "Delhivery (Simulated)",
      trackingId: mockTrackingId,
      trackingUrl: `https://shiprocket.co/tracking/${mockTrackingId}`,
    };
  }

  try {
    const firstName = userRecord.name ? userRecord.name.split(" ")[0] : "Customer";
    const lastName = userRecord.name && userRecord.name.split(" ").length > 1 
      ? userRecord.name.split(" ").slice(1).join(" ") 
      : "User";

    const payload = {
      order_id: paymentRecord._id.toString(),
      order_date: new Date(paymentRecord.createdAt).toISOString().split("T")[0],
      pickup_location: "Primary Warehouse", // Must match your configured Shiprocket pick-up location name
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: paymentRecord.deliveryAddress || "123 Main St",
      billing_city: "Mumbai",
      billing_state: "Maharashtra",
      billing_zipcode: "400001",
      billing_country: "India",
      billing_email: userRecord.email,
      billing_phone: "9999999999", // Placeholder, ideally fetch user's real phone
      shipping_is_billing: true,
      order_items: [
        {
          name: "VIP Welcome Kit",
          sku: "VIP-WEL-KIT",
          units: 1,
          selling_price: paymentRecord.amount,
        },
      ],
      payment_method: paymentRecord.method === "cod" ? "COD" : "Prepaid",
      sub_total: paymentRecord.amount,
      length: 15,
      width: 10,
      height: 5,
      weight: 0.5,
    };

    logger.info(`Sending shipment creation request to Shiprocket for order ${paymentRecord._id}...`);
    const createResponse = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(`Order Creation failed: ${errorData.message || createResponse.statusText}`);
    }

    const orderData = await createResponse.json();
    const shipmentId = orderData.shipment_id;

    if (!shipmentId) {
      throw new Error("Shiprocket did not return a shipment_id");
    }

    logger.info(`Shipment created on Shiprocket. Shipment ID: ${shipmentId}. Requesting AWB/Courier assignment...`);

    // Assign courier partner and generate AWB (Air Waybill) / tracking code
    const assignResponse = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });

    if (!assignResponse.ok) {
      const errorData = await assignResponse.json().catch(() => ({}));
      logger.warn(`Courier assignment failed or pending: ${errorData.message || assignResponse.statusText}. Assigning tracking fallback.`);
      return {
        shipmentId,
        courierPartner: "Shiprocket Pending",
        trackingId: null,
        trackingUrl: null,
      };
    }

    const assignmentData = await assignResponse.json();
    const trackingInfo = assignmentData.response?.data;

    return {
      shipmentId,
      courierPartner: trackingInfo?.courier_name || "Shiprocket Partner",
      trackingId: trackingInfo?.awb_code || null,
      trackingUrl: trackingInfo?.awb_code ? `https://shiprocket.co/tracking/${trackingInfo.awb_code}` : null,
    };
  } catch (error) {
    logger.error(`Error in Shiprocket shipping integration: ${error.message}`);
    // Safe fallback so checkout/payment success flows do not crash completely
    return {
      shipmentId: `fallback-ship-${Date.now()}`,
      courierPartner: "Shiprocket (Awaiting Manual Assignment)",
      trackingId: null,
      trackingUrl: null,
    };
  }
};

module.exports = {
  createShippingOrder,
};
