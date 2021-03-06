import { createContext, ReactNode, useContext,  useState } from 'react';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`)

      const stockProduct: Stock = response.data
      if (!stockProduct) throw new Error()
      const [ productInCart ] = cart.filter(product => product.id === productId)


      if ( productInCart && stockProduct.amount <= productInCart.amount ) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if (productInCart) {
        const newCart = cart.map(item => {
          if (item.id === productId) {
            return {
              ...item,
              amount: productInCart.amount + 1
            }
          }
          return item
        })

        setCart(newCart)  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        toast.success('Produto adicionado com sucesso.')

        return
      }

      const { data } = await api.get(`/products/${productId}`)

      const newCart = [ ...cart, { ...data, amount: 1} ]

      setCart(newCart)  
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          
      toast.success('Produto adicionado com sucesso.')
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const { data } = await api.get(`/stock/${productId}`)

      if (!data) throw new Error()

      const newCart = cart.filter(product => product.id !== productId)

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      toast.success('Quantidade atualizada')
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount === 0) throw Error()

      const { data } = await api.get(`/stock/${productId}`)
      if (!data) throw new Error()
      const productsInStock: Stock = data

      const [productInCart] = cart.filter(item => item.id === productId)

      if ((amount + productInCart.amount) > productsInStock.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const newCart = cart.map(item => {
        if(item.id === productInCart.id) {
          return {
            ...productInCart,
            amount: productInCart.amount + amount
          }
        }

        return item
      })

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      toast.success('Produto adicionado com sucesso.')
    } catch {
      toast.error('Erro na altera????o de quantidade do produto')
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
