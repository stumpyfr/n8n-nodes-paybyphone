# n8n-nodes-paybyphone

This is an n8n community node. It lets you use **PayByPhone** in your n8n workflows.

[PayByPhone](https://www.paybyphone.com/) is a mobile parking payment service that lets drivers pay for parking from their phone without needing coins or a parking meter.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Vehicle
- **List** — Retrieve all registered vehicles on your PayByPhone account (optionally include archived vehicles)

### Location
- **List** — Search for parking locations by location number

### Payment Method
- **List** — Retrieve all payment cards linked to your PayByPhone account

### Rate
- **Get** — Get available rate options for a given location and license plate

### Quote
- **Get** — Get a price quote for a parking session (requires location ID, license plate, rate policy ID, and duration)

### Parking Session
- **List** — List active parking sessions (optionally include past/historic sessions)
- **Start** — Start a new parking session using a quote ID

## Credentials

You need a PayByPhone account to use this node.

1. Sign up or log in at [paybyphone.com](https://www.paybyphone.com/)
2. In n8n, create a new **PayByPhone** credential and provide:
   - **Mobile Number** — the phone number associated with your PayByPhone account (including country code, e.g. `+33612345678`)
   - **Password** — your PayByPhone account password

Authentication is handled automatically via the PayByPhone API.

## Compatibility

- Tested with n8n version 2.x
- Minimum n8n version: 2.x

## Usage

A typical workflow to start a parking session follows these steps:

1. **Location → List** — Search for the parking location by its advertised number (e.g. the number displayed on the sign)
2. **Rate → Get** — Fetch available rate options using the `locationId` returned in step 1 and your vehicle's license plate
3. **Quote → Get** — Get a price quote by providing the `locationId`, license plate, `ratePolicyId` from step 2, and the desired duration (e.g. 2 Hours or 1 Day)
4. **Parking Session → Start** — Start the session using the `quoteId` from step 3

This node can also be used as an **AI tool**, making it compatible with n8n AI agent workflows.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [PayByPhone website](https://www.paybyphone.com/)
