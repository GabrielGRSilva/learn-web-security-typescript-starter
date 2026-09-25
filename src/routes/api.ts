import { Router } from "express";
import type { Dependencies } from "../dependencies.ts";
import { getCurrentSession } from "../auth/sessions.ts";
import {
  findOrderById,
  listAllOrders,
  listOrderItems,
  listOrdersForUser,
} from "../orders/index.ts";
import { listProducts, type Product } from "../products.ts";
import { findApiKey } from "../auth/apiKeys.ts";
import type { Order, OrderItem } from "../orders/index.ts";

type ProductResponse = {
  id: number;
  name: string;
  description: string;
  image_path: string;
  price_cents: number;
};

type OrderResponse = {
  id: number;
  status: Order["status"];
  total_cents: number;
  created_at: string;
};

type OrderItemResponse = {
  product_id: number;
  product_name: string;
  quantity: number;
  price_cents: number;
};

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image_path: product.image_path,
    price_cents: product.price_cents,
  };
};

function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    status: order.status,
    total_cents: order.total_cents,
    created_at: order.created_at,
  };
};

function toOrderItemResponse(orderItem: OrderItem): OrderItemResponse {
  return {
    product_id: orderItem.product_id,
    product_name: orderItem.product_name,
    quantity: orderItem.quantity,
    price_cents: orderItem.price_cents,
  };
};

export function createApiRouter(deps: Dependencies): Router {
  const { db } = deps;
  const router = Router();

  router.get("/api/account/orders", (req, res) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try{
      const orders = listOrdersForUser(db, current.user.id).map(toOrderResponse);
      res.json({ orders: orders });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  });

  router.get("/api/orders/:id", (req, res) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const orderId = Number(req.params.id);
    const order = findOrderById(db, orderId);
    if (!Number.isSafeInteger(orderId) || !order || order.user_id !== current.user.id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    try{
      const cleanOrder = toOrderResponse(order);
      const items = listOrderItems(db, order.id).map(toOrderItemResponse);
      res.json({ order: cleanOrder, items: items });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  });

  router.get("/api/products", (_req, res) => {
    try{
      const products = listProducts(db).map(toProductResponse);
      res.json({ products: products });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  });

  router.get("/api/integrations/warehouse/orders", (_req, res) => {
    const reqApiKey = _req.header("X-API-Key");
    if (reqApiKey){
      const apiKey = findApiKey(db, reqApiKey);
      if(!apiKey) {
        res.status(401).json({error: "Invalid Api-Key!"});
        return;
      }else if(apiKey.scope != "orders:read"){
        res.status(403).json({error: "Invalid Api-Key Scope!"});
        return;
      };
  }else{
    res.status(401).json({error: "No Api-Key provided!"});
    return;
  }
    const orders = listAllOrders(db).map((order) => ({
      id: order.id,
      status: order.status,
      total_cents: order.total_cents,
      created_at: order.created_at,
    }));

    res.json({
      integration: "Warehouse Fulfillment Integration",
      orders,
    });
  });

  return router;
}
