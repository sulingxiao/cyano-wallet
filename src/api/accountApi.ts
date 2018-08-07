/*
 * Copyright (C) 2018 Matus Zamborsky
 * This file is part of The Ontology Wallet&ID.
 *
 * The The Ontology Wallet&ID is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Ontology Wallet&ID is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with The Ontology Wallet&ID.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Account, Crypto, utils, Wallet } from 'ontology-ts-sdk';
import { v4 as uuid } from 'uuid';
import PrivateKey = Crypto.PrivateKey;
import { getWallet } from './authApi';

export function decryptAccount(wallet: Wallet, password: string) {
  const account = wallet.accounts[0];
  const saltHex = Buffer.from(account.salt, 'base64').toString('hex');
  const encryptedKey = account.encryptedKey;
  const scrypt = wallet.scrypt;

  return encryptedKey.decrypt(password, account.address, saltHex, {
    blockSize: scrypt.r,
    cost: scrypt.n,
    parallel: scrypt.p,
    size: scrypt.dkLen
  });
}

export async function accountSignUp(password: string) {
  const mnemonics = utils.generateMnemonic(32);
  return await accountImportMnemonics(mnemonics, password);
}

export async function accountImportMnemonics(mnemonics: string, password: string) {
  // generate NEO address for now
  const privateKey = PrivateKey.generateFromMnemonic(mnemonics, "m/44'/888'/0'/0/0");
  const wif = privateKey.serializeWIF();

  const result = await accountImportPrivateKey(wif, password);

  return {
    mnemonics,
    ...result
  };
}

export async function accountImportPrivateKey(wif: string, password: string) {
  const wallet = Wallet.create(uuid());
  const scrypt = wallet.scrypt;
  const scryptParams = {
    blockSize: scrypt.r,
    cost: scrypt.n,
    parallel: scrypt.p,
    size: scrypt.dkLen
  };

  const privateKey = PrivateKey.deserializeWIF(wif);
  const account = Account.create(privateKey, password, uuid(), scryptParams);

  wallet.addAccount(account);
  wallet.setDefaultAccount(account.address.toBase58());

  return {
    encryptedWif: account.encryptedKey.serializeWIF(),
    wallet: wallet.toJson(),
    wif
  };
}

export function getAddress(walletEncoded: string) {
  const wallet = getWallet(walletEncoded);
  return wallet.defaultAccountAddress;
}