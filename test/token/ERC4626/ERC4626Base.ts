import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { describeBehaviorOfERC4626Base } from '@solidstate/spec';
import {
  ERC4626BaseMock,
  ERC4626BaseMock__factory,
  SolidStateERC20Mock,
  SolidStateERC20Mock__factory,
} from '@solidstate/typechain-types';
import { expect } from 'chai';
import { BigNumber, BigNumberish } from 'ethers';
import { ethers } from 'hardhat';

const name = 'ERC20Metadata.name';
const symbol = 'ERC20Metadata.symbol';
const decimals = 18;

describe('ERC4626Base', () => {
  let deployer: SignerWithAddress;
  let depositor: SignerWithAddress;
  let instance: ERC4626BaseMock;
  let assetInstance: SolidStateERC20Mock;

  before(async () => {
    [deployer, depositor] = await ethers.getSigners();
  });

  beforeEach(async () => {
    assetInstance = await new SolidStateERC20Mock__factory(deployer).deploy(
      '',
      '',
      0,
      0,
    );

    instance = await new ERC4626BaseMock__factory(deployer).deploy(
      assetInstance.address,
      name,
      symbol,
      decimals,
    );
  });

  describeBehaviorOfERC4626Base(async () => instance, {
    getAsset: async () => assetInstance,
    supply: 0,
    mint: (recipient: string, amount: BigNumber | BigNumberish) =>
      instance.__mint(recipient, amount),
    burn: (recipient: string, amount: BigNumber | BigNumberish) =>
      instance.__burn(recipient, amount),
    mintAsset: (recipient: string, amount: BigNumber | BigNumberish) =>
      assetInstance.__mint(recipient, amount),
    name,
    symbol,
    decimals,
  });

  describe('__internal', () => {
    describe('#_deposit(uint256,address)', () => {
      it('calls the _afterDeposit hook', async () => {
        const assetAmount = 10;

        await instance.__mint(deployer.address, assetAmount);
        await assetInstance.__mint(depositor.address, assetAmount);
        await assetInstance
          .connect(depositor)
          .approve(instance.address, assetAmount);

        const shareAmount = await instance.callStatic.previewDeposit(
          assetAmount,
        );

        expect(
          await instance
            .connect(depositor)
            .deposit(assetAmount, depositor.address),
        )
          .to.emit(instance, 'AfterDepositCheck')
          .withArgs(depositor.address, assetAmount, shareAmount);
      });
    });
  });
});
