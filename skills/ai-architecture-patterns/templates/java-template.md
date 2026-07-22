# Architecture Patterns Implementation Playbook 🏛

Este guia prático fornece padrões detalhados, estruturas de diretórios e exemplos reais em **Java 26+** com **Spring
Boot 4.x** otimizados para o **GitHub Copilot**. Use este playbook para guiar o Copilot na geração de código
arquiteturalmente correto e desacoplado.

---

## Conceitos Chave e Diretrizes para o Copilot

### 1. Clean Architecture (Uncle Bob)

* **Camadas (Fluxo de Dependência Inward):**
    * **Domain (Entities/Value Objects):** Modelos de negócio puros e imutáveis.
    * **Application (Use Cases/Ports):** Regras de negócio da aplicação e contratos de interfaces.
    * **Adapters (Interface Adapters):** Controllers REST, Clientes de Banco de Dados (Repositories), Gateways de
      Mensageria.
    * **Infrastructure (Frameworks & Drivers):** Configurações do Spring Boot, Drivers JDBC, segurança.
* **Regra de Ouro:** A camada de domínio e aplicação nunca deve importar classes de pacotes externos (`javax.*`,
  `jakarta.persistence.*`, `org.springframework.*`).

### 2. Arquitetura Hexagonal (Ports & Adapters)

* **Domínio:** O núcleo da aplicação (`Core`).
* **Ports (Portas):** Interfaces Java puras. Podem ser *Inbound* (Drivers - casos de uso expostos) ou *Outbound* (
  Driven - dependências externas como banco ou APIs).
* **Adapters (Adaptadores):** Implementações técnicas das portas usando anotações do Spring.

### 3. Domain-Driven Design (DDD) Tático

* **Records como Value Objects:** Use `record` do Java para garantir imutabilidade e validação estrutural no construtor
  compacto.
* **Aggregates e Invariantes:** Entidades raiz controlam o acesso e garantem a consistência interna da lógica de
  negócio.

---

## Estrutura de Diretórios Recomendada (Java / Maven / Gradle)

Instrua o Copilot a organizar o projeto utilizando a seguinte estrutura de pacotes:

```
com.empresa.sistema/
├── domain/                       # Regras de Negócio e Modelos Puros (Sem Frameworks)
│   ├── model/                   # Entidades e Agregados
│   │   ├── User.java
│   │   └── Order.java
│   ├── valueobject/             # Objetos de Valor Imutáveis (Records)
│   │   ├── Email.java
│   │   └── Money.java
│   └── exception/               # Exceções de Domínio Pure Java
│       └── DomainException.java
├── application/                  # Regras de Aplicação (Casos de Uso)
│   ├── ports/                   # Interfaces (Ports) Inbound/Outbound
│   │   ├── inbound/              # Casos de uso chamados pelo mundo externo
│   │   │   └── CreateUserUseCase.java
│   │   └── outbound/             # Contratos que a infraestrutura deve implementar
│   │       ├── UserRepositoryPort.java
│   │       └── PaymentGatewayPort.java
│   └── usecase/                  # Implementação dos Casos de Uso
│       └── CreateUserUseCaseImpl.java
├── adapters/                     # Adaptadores de Tecnologia (Framework Dependent)
│   ├── inbound/                  # REST Controllers, Listeners de Mensageria
│   │   ├── rest/
│   │   │   ├── UserController.java
│   │   │   └── dto/
│   │   └── event/
│   └── outbound/                 # Repositories JPA/Mongo, Clientes HTTP Feign/WebClient
│       ├── persistence/
│       │   ├── PostgresUserRepository.java
│       │   └── entity/            # Entidades Anotadas com @Entity (Mapeamento JPA)
│       └── gateway/
│           └── StripePaymentAdapter.java
└── infrastructure/               # Configurações Globais e Beans do Spring Boot
    ├── config/
    │   └── BeanInjectionConfig.java
    └── security/
```

---

## Exemplos Práticos de Implementação (Java 26+)

### 1. Camada de Domínio Puro (Sem Anotações do Spring/JPA)

```java
package com.empresa.sistema.domain.valueobject;

// Utilização de Java Record para imutabilidade e validação estrutural nativa
public record Email(String value) {
    public Email {
        if (value == null || !value.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Formato de e-mail inválido");
        }
    }
}
```

```java
package com.empresa.sistema.domain.model;

import com.empresa.sistema.domain.valueobject.Email;

import java.time.LocalDateTime;
import java.util.UUID;

// Entidade de domínio pura: foca em regras de comportamento de negócio
public class User {
    private final UUID id;
    private final Email email;
    private String name;
    private final LocalDateTime createdAt;
    private boolean active;

    public User(UUID id, Email email, String name) {
        this.id = id != null ? id : UUID.randomUUID();
        this.email = email;
        this.name = name;
        this.createdAt = LocalDateTime.now();
        this.active = true;
    }

    // Regras de negócio encapsuladas
    public void deactivate() {
        this.active = false;
    }

    public boolean canPlaceOrders() {
        return this.active;
    }

    // Getters
    public UUID id() {
        return id;
    }

    public Email email() {
        return email;
    }

    public String name() {
        return name;
    }

    public LocalDateTime createdAt() {
        return createdAt;
    }

    public boolean isActive() {
        return active;
    }
}
```

### 2. Camada de Aplicação (Ports e Use Cases)

```java
package com.empresa.sistema.application.ports.outbound;

import com.empresa.sistema.domain.model.User;
import com.empresa.sistema.domain.valueobject.Email;

import java.util.Optional;
import java.util.UUID;

// Port de Saída (Contrato puro que a infraestrutura deve atender)
public interface UserRepositoryPort {
    Optional<User> findById(UUID id);

    Optional<User> findByEmail(Email email);

    User save(User user);
}
```

```java
package com.empresa.sistema.application.ports.inbound;

import com.empresa.sistema.domain.model.User;

// Port de Entrada (Caso de Uso)
public interface CreateUserUseCase {
    record Command(String email, String name) {
    }

    record Response(User user, boolean success, String errorMessage) {
    }

    Response execute(Command command);
}
```

```java
package com.empresa.sistema.application.usecase;

import com.empresa.sistema.application.ports.inbound.CreateUserUseCase;
import com.empresa.sistema.application.ports.outbound.UserRepositoryPort;
import com.empresa.sistema.domain.model.User;
import com.empresa.sistema.domain.valueobject.Email;

// Implementação pura do caso de uso. Não possui @Service do Spring para manter desacoplamento.
public class CreateUserUseCaseImpl implements CreateUserUseCase {

    private final UserRepositoryPort userRepositoryPort;

    public CreateUserUseCaseImpl(UserRepositoryPort userRepositoryPort) {
        this.userRepositoryPort = userRepositoryPort;
    }

    @Override
    public Response execute(Command command) {
        try {
            Email emailVo = new Email(command.email());

            if (userRepositoryPort.findByEmail(emailVo).isPresent()) {
                return new Response(null, false, "E-mail já cadastrado no sistema.");
            }

            User newUser = new User(null, emailVo, command.name());
            User savedUser = userRepositoryPort.save(newUser);

            return new Response(savedUser, true, null);
        } catch (IllegalArgumentException e) {
            return new Response(null, false, e.getMessage());
        }
    }
}
```

### 3. Camada de Adaptadores (Infraestrutura e Spring REST/JPA)

```java
package com.empresa.sistema.adapters.outbound.persistence.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserJpaEntity {
    @Id
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    private LocalDateTime createdAt;
    private boolean active;

    // Getters, Setters, Construtores para o Hibernate
}
```

```java
package com.empresa.sistema.adapters.outbound.persistence;

import com.empresa.sistema.adapters.outbound.persistence.entity.UserJpaEntity;
import com.empresa.sistema.application.ports.outbound.UserRepositoryPort;
import com.empresa.sistema.domain.model.User;
import com.empresa.sistema.domain.valueobject.Email;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class PostgresUserRepository implements UserRepositoryPort {

    private final SpringDataPostgresRepository jpaRepository;

    public PostgresUserRepository(SpringDataPostgresRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<User> findByEmail(Email email) {
        return jpaRepository.findByEmail(email.value()).map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserJpaEntity entity = toJpaEntity(user);
        jpaRepository.save(entity);
        return user;
    }

    // Mappers de tradução entre camada técnica e de domínio
    private User toDomain(UserJpaEntity entity) {
        return new User(entity.getId(), new Email(entity.getEmail()), entity.getName());
    }

    private UserJpaEntity toJpaEntity(User user) {
        UserJpaEntity entity = new UserJpaEntity();
        entity.setId(user.id());
        entity.setEmail(user.email().value());
        entity.setName(user.name());
        entity.setCreatedAt(user.createdAt());
        entity.setActive(user.isActive());
        return entity;
    }
}
```

```java
package com.empresa.sistema.adapters.inbound.rest;

import com.empresa.sistema.application.ports.inbound.CreateUserUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final CreateUserUseCase createUserUseCase;

    public UserController(CreateUserUseCase createUserUseCase) {
        this.createUserUseCase = createUserUseCase;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody CreateUserDto dto) {
        var command = new CreateUserUseCase.Command(dto.email(), dto.name());
        var response = createUserUseCase.execute(command);

        if (!response.success()) {
            return ResponseEntity.badRequest().body(response.errorMessage());
        }

        return ResponseEntity.ok(response.user());
    }

    public record CreateUserDto(String email, String name) {
    }
}
```

### 4. Camada de Inicialização e Injeção de Dependências (Spring Config)

```java
package com.empresa.sistema.infrastructure.config;

import com.empresa.sistema.application.ports.inbound.CreateUserUseCase;
import com.empresa.sistema.application.ports.outbound.UserRepositoryPort;
import com.empresa.sistema.application.usecase.CreateUserUseCaseImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanInjectionConfig {

    // Instancia os casos de uso explicitamente injetando as portas de infraestrutura.
    // Isso mantém a camada de aplicação sem nenhuma anotação de framework.
    @Bean
    public CreateUserUseCase createUserUseCase(UserRepositoryPort userRepositoryPort) {
        return new CreateUserUseCaseImpl(userRepositoryPort);
    }
}
```

---

## Checklist de Boas Práticas para Revisão de Código com Copilot

1. **Isolamento do Domínio:** A pasta `domain/` contém alguma referência ao Spring Boot, Hibernate ou Jackson? Se sim,
   mova para `adapters/` ou `infrastructure/`.
2. **Imutabilidade:** Os Value Objects estão mapeados como `record` para evitar efeitos colaterais de mutabilidade?
3. **Mapeamentos Isolados:** A entidade anotada com `@Entity` do banco de dados é a mesma utilizada nas validações do
   domínio? Elas devem ser estritamente separadas com conversores (*mappers*).
4. **Tratamento de Falhas (Durable Execution):** Se o fluxo contiver chamadas assíncronas de longa duração que
   necessitam de tolerância a quedas catastróficas, o Copilot utilizou resiliência nativa de infraestrutura (ex: tabelas
   de estado em workflows duráveis) em vez de lógica de repetição no domínio?

## Armadilhas Comuns (Anti-padrões a Evitar)

* **Modelo de Domínio Anêmico:** Classes de domínio que contêm apenas getters e setters sem validação ou lógica
  comportamental.
* **Vazamento de Infraestrutura:** Expor tipos do banco de dados, como IDs sequenciais criados pelo banco (
  `GenerationType.IDENTITY`), diretamente em métodos do Core de Domínio. Prefira UUIDs auto-gerados.
* **Controllers Gordos:** Lógica de decisão de negócio ou orquestração implementada diretamente dentro de métodos
  `@PostMapping` do REST Controller.