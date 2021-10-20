import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {api} from "../services/api";


type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode
}

type AuthResponse = {
  token: string;
  user: User
}

export function AuthProvider (props: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const signInUrl = "https://github.com/login/oauth/authorize?scope=user&client_id=15b48b17e3e90dfb6327";

  async function signIn (githubCode: string) {
    const response = await api.post<AuthResponse>("authenticate", {
      code: githubCode
    });
    const {token, user} = response.data;
    localStorage.setItem('@dowhile:token', token);
    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  function signOut () {
    setUser(null);
    localStorage.removeItem("@dowhile:token");
  }


  useEffect(() => {
    const token = localStorage.getItem("@dowhile:token");
    api.defaults.headers.common.authorization = `Bearer ${token}`;
    if (token) {
      api.get<User>('profile').then(response => {
        setUser(response.data);
      });
    }
  }, []);


  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes("?code=");
    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=');
      window.history.pushState({}, '', urlWithoutCode);
      signIn(githubCode);
    }
  }, []);


  return (
    <AuthContext.Provider value={{signInUrl, user, signOut}}>
      {props.children}
    </AuthContext.Provider>
  );

}

export const useAuth = () => useContext(AuthContext);

