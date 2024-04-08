import { Injectable } from '@nestjs/common';
import { ImplementsAtRuntime } from '@catalist-nestjs/di';
import {
  GenesisForkVersionServiceInterface,
  Key,
  KeyValidatorInterface,
  CatalistKey,
  CatalistKeyValidatorInterface,
  PossibleWC,
  WithdrawalCredentialsBuffer,
  WithdrawalCredentialsExtractorInterface,
} from '../interfaces';

@Injectable()
@ImplementsAtRuntime(CatalistKeyValidatorInterface)
export class CatalistKeyValidator implements CatalistKeyValidatorInterface {
  public constructor(
    protected readonly keyValidator: KeyValidatorInterface,
    protected readonly wcExtractor: WithdrawalCredentialsExtractorInterface,
    protected readonly genesisForkVersionService: GenesisForkVersionServiceInterface,
  ) {}

  public async validateKey<T>(
    catalistKey: CatalistKey & T,
  ): Promise<[Key & CatalistKey & T, boolean]> {
    const possibleWC =
      await this.wcExtractor.getPossibleWithdrawalCredentials();

    return (
      await this.validateCatalistKeysForDifferentPossibleWC(
        [catalistKey],
        possibleWC,
      )
    )[0];
  }

  public async validateKeys<T>(
    catalistKeys: (CatalistKey & T)[],
  ): Promise<[Key & CatalistKey & T, boolean][]> {
    if (catalistKeys.length === 0) {
      return [];
    }
    const possibleWC =
      await this.wcExtractor.getPossibleWithdrawalCredentials();

    return await this.validateCatalistKeysForDifferentPossibleWC(
      catalistKeys,
      possibleWC,
    );
  }

  protected async validateCatalistKeysForDifferentPossibleWC<T>(
    catalistKeys: (CatalistKey & T)[],
    possibleWC: PossibleWC,
  ): Promise<[Key & CatalistKey & T, boolean][]> {
    const chainId = await this.wcExtractor.getChainId();
    const genesisForkVersion =
      await this.genesisForkVersionService.getGenesisForkVersion(chainId);

    const unUsedKeys = catalistKeys
      .filter((catalistKey) => !catalistKey.used)
      .map((catalistKey) =>
        this.catalistKeyToBasicKey<T>(
          catalistKey,
          possibleWC.currentWC[1],
          genesisForkVersion,
        ),
      );

    const usedKeys = catalistKeys
      .filter((catalistKey) => catalistKey.used)
      .map((catalistKey) =>
        this.catalistKeyToBasicKey<T>(
          catalistKey,
          possibleWC.currentWC[1],
          genesisForkVersion,
        ),
      );

    // 1. first step of validation - unused keys with ONLY current WC
    const unUsedKeysResults = await this.keyValidator.validateKeys<
      CatalistKey & T
    >(
      unUsedKeys.map((key) => ({
        ...key,
        withdrawalCredentials: possibleWC.currentWC[1],
      })),
    );

    let usedKeysResults: typeof unUsedKeysResults = [];

    let remainingKeys = usedKeys;
    let notValidKeys: typeof usedKeysResults = [];

    // TODO solve performance issues when there are many keys
    // 2. second step of validation - used keys with current and multiple previous WC
    for (const wc of [possibleWC.currentWC, ...possibleWC.previousWC]) {
      const resultsForWC = await this.keyValidator.validateKeys(
        // validating keys with previous WC
        remainingKeys.map((key) => ({
          ...key,
          withdrawalCredentials: wc[1],
        })),
      );

      const validKeys = resultsForWC.filter((res) => res[1]);

      // Adding not valid keys for next iteration
      notValidKeys = resultsForWC.filter((res) => !res[1]);
      remainingKeys = notValidKeys.map((res) => res[0]);

      usedKeysResults = usedKeysResults.concat(validKeys);
    }

    usedKeysResults = usedKeysResults.concat(notValidKeys);

    return usedKeysResults.concat(unUsedKeysResults);
  }

  protected catalistKeyToBasicKey<T>(
    catalistKey: CatalistKey & T,
    withdrawalCredentials: WithdrawalCredentialsBuffer,
    genesisForkVersion: Buffer,
  ): Key & CatalistKey & T {
    return {
      ...catalistKey,
      withdrawalCredentials: withdrawalCredentials,
      genesisForkVersion,
    };
  }
}
