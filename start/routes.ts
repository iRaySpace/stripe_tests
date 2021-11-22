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

import Route from '@ioc:Adonis/Core/Route'
import Env from '@ioc:Adonis/Core/Env'
import Stripe from 'stripe'

const stripe = new Stripe(Env.get('STRIPE_KEY'), {
  apiVersion: '2020-08-27',
});

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.post('/get_upcoming_invoice', async ({ request, response }) => {
  const { customer, subscription } = request.body()
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({ customer, subscription })
    return invoice
  } catch (err) {
    return response.status(500).send({ detail: err.code })
  }
})

Route.post('/pay_invoice', async ({ request, response }) => {
  const { invoice } = request.body()
  try {
    const paidInvoice = await stripe.invoices.pay(invoice, {
      paid_out_of_band: true
    })
    return paidInvoice
  } catch (err) {
    console.log(err)
    return response.status(500)
  }
})

Route.post('/get_subscription', async ({ request, response }) => {
  const { subscription } = request.body()
  try {
    const data = await stripe.subscriptions.retrieve(subscription, { expand: ['latest_invoice'] })
    return data
  } catch (err) {
    console.log(err)
    return response.status(500)
  }
})

Route.post('/get_invoices', async ({ request, response }) => {
  const { subscription } = request.body()
  try {
    const data = await stripe.invoices.list({ subscription, status: "open", expand: ['data.payment_intent'] })
    return data
  } catch (err) {
    console.log(err)
    return response.status(500)
  }
})
