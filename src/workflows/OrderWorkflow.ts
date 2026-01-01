/**
 * Example workflow demonstrating @effect/workflow on Cloudflare Durable Objects
 *
 * This workflow shows the three core primitives:
 * - Activity.make: Durable steps that are journaled and replayable
 * - DurableClock.sleep: Durable sleep using DO alarms
 * - DurableDeferred: Wait for external events
 */

import { Workflow, Activity, DurableClock, DurableDeferred } from "@effect/workflow"
import { Effect, Schema } from "effect"

// Define the workflow payload schema
const OrderPayload = Schema.Struct({
  orderId: Schema.String,
  customerId: Schema.String,
  items: Schema.Array(
    Schema.Struct({
      productId: Schema.String,
      quantity: Schema.Number,
    })
  ),
})

// Define the workflow success schema
const OrderResult = Schema.Struct({
  orderId: Schema.String,
  status: Schema.Literal("fulfilled"),
  trackingNumber: Schema.String,
})

// Define the workflow error schema
const OrderError = Schema.Union(
  Schema.Struct({
    _tag: Schema.Literal("PaymentFailed"),
    reason: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("InventoryUnavailable"),
    productId: Schema.String,
  })
)

// Create the workflow definition
export const OrderWorkflow = Workflow.make({
  name: "order-fulfillment",
  payload: OrderPayload,
  success: OrderResult,
  error: OrderError,
  idempotencyKey: (payload) => payload.orderId,
})

// Define activities (durable steps)
const ReserveInventory = Activity.make({
  name: "reserve-inventory",
  success: Schema.Struct({
    reservationId: Schema.String,
  }),
  execute: Effect.gen(function* () {
    // Simulate inventory reservation
    console.log("Reserving inventory...")
    yield* Effect.sleep("100 millis")
    return { reservationId: `res-${crypto.randomUUID().slice(0, 8)}` }
  }),
})

const ProcessPayment = Activity.make({
  name: "process-payment",
  success: Schema.Struct({
    paymentId: Schema.String,
    amount: Schema.Number,
  }),
  execute: Effect.gen(function* () {
    // Simulate payment processing
    console.log("Processing payment...")
    yield* Effect.sleep("100 millis")
    return {
      paymentId: `pay-${crypto.randomUUID().slice(0, 8)}`,
      amount: 99.99,
    }
  }),
})

const ShipOrder = Activity.make({
  name: "ship-order",
  success: Schema.Struct({
    trackingNumber: Schema.String,
  }),
  execute: Effect.gen(function* () {
    // Simulate shipping
    console.log("Shipping order...")
    yield* Effect.sleep("100 millis")
    return { trackingNumber: `TRACK-${crypto.randomUUID().slice(0, 8)}` }
  }),
})

// Create the deferred for warehouse confirmation
export const WarehouseConfirmation = DurableDeferred.make(
  "warehouse-confirmation",
  {
    success: Schema.Struct({
      ready: Schema.Boolean,
      estimatedShipDate: Schema.String,
    }),
  }
)

// Implement the workflow
export const OrderWorkflowLive = OrderWorkflow.toLayer((payload) =>
  Effect.gen(function* () {
    console.log(`Starting order workflow for order ${payload.orderId}`)

    // Step 1: Reserve inventory (durable activity)
    const reservation = yield* ReserveInventory
    console.log(`Inventory reserved: ${reservation.reservationId}`)

    // Step 2: Process payment (durable activity)
    const payment = yield* ProcessPayment
    console.log(`Payment processed: ${payment.paymentId}`)

    // Step 3: Wait for warehouse confirmation (durable deferred)
    // This suspends the workflow until an external event arrives
    console.log("Waiting for warehouse confirmation...")
    const confirmation = yield* DurableDeferred.await(WarehouseConfirmation)

    if (!confirmation.ready) {
      return yield* Effect.fail({
        _tag: "InventoryUnavailable" as const,
        productId: payload.items[0]?.productId ?? "unknown",
      })
    }
    console.log(
      `Warehouse confirmed, ship date: ${confirmation.estimatedShipDate}`
    )

    // Step 4: Optional delay (durable sleep using DO alarm)
    // In real usage, you might wait until the ship date
    console.log("Waiting before shipping...")
    yield* DurableClock.sleep({
      name: "pre-ship-delay",
      duration: "5 seconds", // Short for demo purposes
    })

    // Step 5: Ship the order (durable activity)
    const shipment = yield* ShipOrder
    console.log(`Order shipped: ${shipment.trackingNumber}`)

    return {
      orderId: payload.orderId,
      status: "fulfilled" as const,
      trackingNumber: shipment.trackingNumber,
    }
  })
)
