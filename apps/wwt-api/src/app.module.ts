import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';

@Module({
  imports: [
    ConfigModule.forRoot({}),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      playground: true,
      uploads: false,
      autoSchemaFile: true,
      formatError: (error: T) => {
        console.error('GraphQL Error:', error);

        const graphQLFormattedError = {
          code: error?.extensions?.code || 'INTERNAL_SERVER_ERROR',

          message:
            error?.extensions?.exception?.response?.message ||
            error?.extension?.response?.message ||
            error?.message,
        };

        console.error('Formatted GraphQL Error:', graphQLFormattedError);
        return graphQLFormattedError;
      },
    }),
    ComponentsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
