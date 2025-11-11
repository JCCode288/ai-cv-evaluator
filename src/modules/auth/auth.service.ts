import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { User } from '../database/mongodb/schemas';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from 'src/utils/auth.config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: RegisterDto) {
    try {
      const hashedPassword = await this.hashData(createUserDto.password);

      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });
      await newUser.save();

      const tokens = await this.getTokens(
        (newUser._id as any).toString(),
        newUser.username,
      );
      await this.updateRefreshToken(
        (newUser._id as any).toString(),
        tokens.refreshToken,
      );

      return tokens;
    } catch (err) {
      if (err?.message?.includes('duplicate key error'))
        throw new BadRequestException('You are already registered');

      throw err;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ username: loginDto.username });
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.getTokens(
      (user._id as any).toString(),
      user.username,
    );
    await this.updateRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );

    return tokens;
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }
    const { email, firstName, lastName } = req.user;
    const username = email.split('@')[0];

    let user = await this.userModel.findOne({ email });
    if (!user) {
      const newUser = new this.userModel({
        username,
        email,
        name: `${firstName} ${lastName}`,
      });
      user = await newUser.save();
    }

    const tokens = await this.getTokens(
      (user._id as any).toString(),
      user.username,
    );
    await this.updateRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );
    return tokens;
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

    const tokens = await this.getTokens(
      (user._id as any).toString(),
      user.username,
    );
    await this.updateRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.userModel.findByIdAndUpdate(userId, { hashedRefreshToken });
  }

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  async getTokens(userId: string, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username },
        { secret: jwtConstants.secret, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, username },
        { secret: jwtConstants.secret, expiresIn: '7d' },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
