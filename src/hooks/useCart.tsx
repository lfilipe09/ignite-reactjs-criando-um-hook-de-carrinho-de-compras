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

interface ProductAmount {
  id: number;
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

    //arrumando o carrinho que já vem sem amount

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  //console.log('esse eh o cart', cart)
  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]
      const productExistCart = newCart.find(product => product.id === productId)
      const stock = await api(`/stock/${productId}`)
      const currentAmount = productExistCart ? productExistCart.amount + 1 : 0

      //já elimina antes se tiver fora de estoque
      if (stock.data.amount < currentAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (productExistCart) {
        productExistCart.amount += 1
      } else {
        const productAdd = await api(`/products/${productId}`)
        const productAddAmount = { ...productAdd.data, amount: 1 }
        newCart.push(productAddAmount)
      }
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };


  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const indexToRemove = newCart.findIndex((product) => product.id === productId)
      //se nao existe o indexToRemove = -1
      if (indexToRemove >= 0) {
        newCart.splice(indexToRemove, 1)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const newCart = [...cart]
      const currentProduct = newCart.find(product => product.id === productId)
      const stock = await api.get(`/stock/${productId}`)

      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (currentProduct) {
        currentProduct.amount = amount
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw Error()
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
