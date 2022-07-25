/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from "@ioc:Adonis/Core/Route";
import Env from "@ioc:Adonis/Core/Env";
import Stripe from "stripe";

const stripe = new Stripe(Env.get("STRIPE_TEST_KEY"), {
  apiVersion: "2020-08-27",
});

Route.get("/", async () => {
  return { hello: "world" };
});

Route.post("/get_upcoming_invoice", async ({ request, response }) => {
  const { customer, subscription } = request.body();
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer,
      subscription,
    });
    return invoice;
  } catch (err) {
    return response.status(500).send({ detail: err.code });
  }
});

Route.post("/get_upcoming_invoice_lines", async ({ request, response }) => {
  const { customer, subscription } = request.body();
  try {
    const invoice = await stripe.invoices.listUpcomingLineItems({
      customer,
      subscription,
    });
    return invoice;
  } catch (err) {
    return response.status(500).send({ detail: err.code });
  }
});

Route.post("/pay_invoice", async ({ request, response }) => {
  const { invoice } = request.body();
  try {
    const paidInvoice = await stripe.invoices.pay(invoice, {
      paid_out_of_band: true,
    });
    return paidInvoice;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/get_subscription", async ({ request, response }) => {
  const { subscription } = request.body();
  try {
    const data = await stripe.subscriptions.retrieve(subscription, {
      expand: ["latest_invoice"],
    });
    return data;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/get_invoices", async ({ request, response }) => {
  const { subscription } = request.body();
  try {
    const data = await stripe.invoices.list({
      subscription,
      status: "open",
      expand: ["data.payment_intent"],
    });
    return data;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/get_invoice_item", async ({ request, response }) => {
  const { id } = request.body();
  try {
    const data = await stripe.invoiceItems.retrieve(id);
    return data;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/get_invoice_line_items", async ({ request, response }) => {
  const { id } = request.body();
  try {
    const data = await stripe.invoices.listLineItems(id);
    return data;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/update_subscription", async ({ request, response }) => {
  const { subscription, quantity, price } = request.body();
  try {
    const existingSubscription = await stripe.subscriptions.retrieve(
      subscription
    );
    const firstItem = existingSubscription.items.data[0];
    const updatedSubscription = await stripe.subscriptions.update(
      existingSubscription.id,
      {
        proration_behavior: "none",
        items: [
          {
            id: firstItem.id,
            quantity,
            price,
          },
        ],
      }
    );
    return updatedSubscription;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/update_invoice_item", async ({ request, response }) => {
  const { id, quantity } = request.body();
  try {
    const updatedInvoiceItem = await stripe.invoiceItems.update(id, { quantity });
    return updatedInvoiceItem;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/finalize_invoice", async ({ request, response }) => {
  const { invoice } = request.body();
  try {
    const updatedInvoice = await stripe.invoices.finalizeInvoice(invoice);
    return updatedInvoice;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});

Route.post("/make_invoice", async ({ request, response }) => {
  const { customer, description, amount, currency, period, metadata } = request.body();
  try {
    await stripe.invoiceItems.create({
      customer,
      amount,
      description,
      currency,
      period,
      metadata,
    });
    const invoice = await stripe.invoices.create({
      customer,
      collection_method: "send_invoice",
      days_until_due: 1,
    });
    return invoice;
  } catch (err) {
    console.log(err);
    return response.status(500);
  }
});
