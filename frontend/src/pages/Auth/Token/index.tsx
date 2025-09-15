import React from 'react';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { useEnterToken, useCompleteRegistration } from './index.ts';

// EnterToken Component
const EnterToken: React.FC = () => {
  usePageTitle('Registrační token');
  const {
    token,
    isLoading,
    handleSubmit,
    handleTokenChange,
    navigateToLogin,
  } = useEnterToken();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zadejte registrační token
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Pro dokončení registrace zadejte token, který jste obdrželi
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="token"
            name="token"
            type="text"
            label="Registrační token"
            required
            placeholder="Zadejte váš registrační token"
            value={token}
            onChange={handleTokenChange}
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Zpracovávám...' : 'Pokračovat'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={navigateToLogin}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    </div>
  );
};

// CompleteRegistration Component
const CompleteRegistration: React.FC = () => {
  usePageTitle('Dokončení registrace');
  const {
    formData,
    isLoading,
    isLoadingUsername,
    hasValidToken,
    handleSubmit,
    handlePasswordChange,
  } = useCompleteRegistration();

  if (!hasValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Neplatný odkaz</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tento odkaz pro dokončení registrace je neplatný. Kontaktujte prosím organizátora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dokončení registrace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vytvořte si své přihlašovací údaje pro přístup do aplikace
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <Input
            id="username"
            name="username"
            type="text"
            label="Uživatelské jméno"
            required
            value={isLoadingUsername ? 'Načítám...' : formData.username}
            onChange={() => {}}
            placeholder="Uživatelské jméno"
            disabled={true}
          />
          {isLoadingUsername && (
            <p className="text-sm text-gray-500 -mt-1">Načítám uživatelské jméno...</p>
          )}
          <p className="text-sm text-gray-500 -mt-1">Uživatelské jméno nelze změnit - je určeno vaším registračním tokenem</p>
          <PasswordInput
            id="password"
            name="password"
            label="Heslo"
            required
            value={formData.password}
            onChange={handlePasswordChange}
            placeholder="Heslo"
            disabled={isLoading || isLoadingUsername}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLoadingUsername}
          >
            {isLoading ? 'Dokončuji registraci...' : 'Dokončit registraci'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export { EnterToken, CompleteRegistration };
