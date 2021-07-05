import React, {FC, memo, useCallback, useRef, useState} from "../../lib/teact/teact";
import {GlobalActions, GlobalState} from "../../global/types";
import Loading from "../ui/Loading";
import InputText from "../ui/InputText";
import {FormEvent} from "react";
import {withGlobal} from "../../lib/teact/teactn";
import {pick} from "../../util/iteratees";
import Button from "../ui/Button";

type StateProps = Pick<GlobalState, 'connectionState' | 'authIsLoading' | 'authError'>;
type DispatchProps = Pick<GlobalActions, 'setAuthBotToken'>;

type OwnProps = {
  onSubmit: (token: string) => void;
}

const AuthBotToken: FC<StateProps & DispatchProps & OwnProps> = ({authIsLoading, authError, onSubmit}) => {
  const [token, setToken] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onTokenChange = useCallback((e: FormEvent<HTMLInputElement>) => {
    const {currentTarget: target} = e;
    setToken(target.value);
  }, []);

  return (
    <div id="auth-bot-token-form" className="custom-scroll">
      <div className="auth-form">
        <h2>Enter bot api token</h2>
        <InputText
          ref={inputRef}
          id="bot-token"
          label="Token"
          onInput={onTokenChange}
          value={token}
          error={authError}
          autoComplete="off"
          inputMode="text"
        />
        <Button onClick={() => onSubmit(token)}>
          Authorize
        </Button>
        {authIsLoading && <Loading/>}
      </div>
    </div>
  );
}

export default memo(withGlobal<OwnProps>(
  (global): StateProps => pick(global, ['authIsLoading', 'authError']),
  (setGlobal, actions): DispatchProps => pick(actions, ['setAuthBotToken'])
)(AuthBotToken));
