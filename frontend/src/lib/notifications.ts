import type { websocket_api } from 'schema-js';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { actingAs, markets, users } from './api';
import { user } from './auth';

export const notifyUser = (msg: websocket_api.ServerMessage | null): void => {
	console.log('got server message', msg?.toJSON());

	switch (msg?.message) {
		case 'marketCreated': {
			const marketCreated = msg.marketCreated!;
			if (marketCreated.ownerId === get(user)?.id) {
				toast.success('Market created', { description: marketCreated.name! });
			}
			return;
		}
		case 'marketSettled': {
			const marketSettled = msg.marketSettled!;
			const currentMarkets = get(markets);
			const marketStore = currentMarkets[marketSettled.id];
			if (!marketStore) {
				console.error('Market not in state', { marketSettled });
				return;
			}
			const market = get(marketStore);
			const description = `${market.name} settled at ${marketSettled.settlePrice}`;
			if (market.ownerId === get(user).id) {
				toast.success('Market settled', { description });
			} else {
				toast.info('Market settled', { description });
			}
			return;
		}
		case 'orderCancelled': {
			const orderCancelled = msg.orderCancelled!;
			const market = get(get(markets)[orderCancelled.marketId]);
			const order = market.orders?.find((o) => o.id === orderCancelled.id);
			if (order?.ownerId === get(actingAs)) {
				toast.success('Order cancelled');
			}
			return;
		}
		case 'orderCreated': {
			const orderCreated = msg.orderCreated!;
			const fillSize = orderCreated.fills?.reduce((acc, fill) => acc + Number(fill.sizeFilled), 0);
			const fillPrice = orderCreated.fills?.reduce(
				(acc, fill) => acc + (Number(fill.price) * Number(fill.sizeFilled)) / fillSize!,
				0
			);
			const fillSizeString = String(fillSize || '').includes('.') ? fillSize?.toFixed(2) : fillSize;
			const fillPriceString = String(fillPrice || '').includes('.')
				? fillPrice?.toFixed(2)
				: fillPrice;
			const message = orderCreated.order
				? orderCreated.fills?.length
					? `Order partially filled`
					: 'Order created'
				: `Order filled`;
			const description = fillSize ? `filled ${fillSizeString} @ ${fillPriceString}` : undefined;
			if (orderCreated.userId === get(actingAs)) {
				toast.success(message, { description });
			}
			return;
		}
		case 'paymentCreated': {
			const paymentCreated = msg.paymentCreated!;
			const amount = paymentCreated.amount;
			const currentUsers = get(users);
			const payer = currentUsers.get(paymentCreated.payerId || '');
			const recipient = currentUsers.get(paymentCreated.recipientId || '');

			if (payer?.id === get(actingAs)) {
				toast.success('Payment created', { description: `You paid ${recipient?.name} ${amount}` });
			} else if (recipient?.id === get(actingAs)) {
				toast.info('Payment created', { description: `${payer?.name} paid you ${amount}` });
			} else {
				console.error('Bad paymentCreated message', { paymentCreated });
			}
			return;
		}
		case 'ownership': {
			const ownership = msg.ownership!;
			const currentUsers = get(users);
			const botName = currentUsers.get(ownership?.ofBotId || '')?.name;
			toast.info('Ownership recieved', { description: `You now own ${botName}` });
			return;
		}
		case 'out':
			toast.success('Orders cancelled');
			return;
		case 'ownershipGiven':
			toast.success('Ownership given');
			return;
		case 'requestFailed': {
			const requestFailed = msg.requestFailed!;
			toast.error(`${requestFailed.requestDetails?.kind} failed`, {
				description: `Reason: ${requestFailed.errorDetails?.message}`
			});
			return;
		}
	}
};
