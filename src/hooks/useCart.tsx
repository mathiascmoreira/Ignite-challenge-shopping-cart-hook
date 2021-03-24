import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const stockResponse = await api.get(`stock/${productId}`);
      const stockAmount = stockResponse.data.amount as Number;

      const cartProduct = cart.find(product => product.id === productId);

      if (cartProduct) {
        if (cartProduct.amount + 1 > stockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        cartProduct.amount += 1;
      }
      else {
        if (stockAmount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const response = await api.get(`products/${productId}`)

        const product = { ...response.data, amount: 1 };

        cart.push(product);
      }

      setCart([...cart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if(!cart.find(product => product.id === productId)) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const newCart = cart.filter(product => product.id !== productId);

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1)
        return;

      const stockResponse = await api.get(`stock/${productId}`);
      const stockAmount = stockResponse.data.amount as number;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const cartProduct = cart.find(product => product.id === productId);


      if (cartProduct) {
        cartProduct.amount = amount;

        setCart([...cart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
